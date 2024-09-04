import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongooose from 'mongoose';
import { Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { AppUser } from '../appUser/appUser.schema';
import { AppUserService } from '../appUser/appUser.service';
import { InvalidObjectIdException } from '../exceptions/invalid-objectId.exception';
import { PointCardCreationException } from '../exceptions/point-card-creation.exception';
import { PointCardNotFoundException } from '../exceptions/point-card-not-found.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { UserNotOwnerOfPointcardException } from '../exceptions/user-not-owner-of-pointcard.exception';
import { BusinessPointCardDto } from './DTO/BusinessPointCardDto';
import { BusinessPointCardUpdateDTO } from './DTO/BusinessPointCardUpdateDTO';
import { BusinessPointCard } from './point-Crad.schema';
import { CustomerPointCardService } from '../customer-point-card/customer-point-card.service';
import { amountOfCards } from '../appUser/role.enum';
import { PointCardAmountReachedException } from '../exceptions/point-card-amount-reached.exception';

@Injectable()
export class PointCardService {
  userModel: any;
  //Dependecy Injection for PointCardModel
  constructor(
    @InjectModel(BusinessPointCard.name)
    private businessPointCardModel: mongooose.Model<BusinessPointCard>,
    private readonly appUserService: AppUserService,
    private readonly customerPointCardService: CustomerPointCardService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    businessPointCardDto: BusinessPointCardDto,
    user: AppUser,
  ): Promise<BusinessPointCardDto> {
    // Hol die Rolle des Benutzers und die maximale Anzahl von Karten für diese Rolle
    const userRole = user.roles[0];
    const maxCardsAllowed = amountOfCards.get(userRole);

    // Zähle die bereits vorhandenen Karten des Benutzers
    const currentCardCount = await this.businessPointCardModel.countDocuments({
      company: user.company.toString(),
    });

    // Überprüfe, ob die aktuelle Anzahl die maximal erlaubte Anzahl überschreitet
    if (currentCardCount >= maxCardsAllowed) {
      throw new PointCardAmountReachedException(this.i18n);
    }

    // Erstelle eine neue Karte
    const businessPointCard = new this.businessPointCardModel({
      name: businessPointCardDto.name,
      maxpoints: businessPointCardDto.maxpoints,
      discount: businessPointCardDto.discount,
      description: businessPointCardDto.description,
      company: user.company.toString(),
    });

    try {
      // Speichere die neue Karte in der Datenbank
      await businessPointCard.save();

      // Aktualisiere den Benutzer mit der neuen Karte
      await this.appUserService.updateAppUserBusinessPointCard(
        user._id,
        businessPointCard._id,
      );

      return businessPointCard;
    } catch (error) {
      throw new PointCardCreationException(error.message, this.i18n);
    }
  }

  async findAllByUser(requestUserID: string): Promise<BusinessPointCard[]> {
    const user = await this.appUserService.findById(requestUserID); // Annahme, dass Sie eine solche Methode haben

    if (!user) {
      throw new UserNotFoundException(user._id, this.i18n);
    }

    return this.businessPointCardModel.find({
      _id: { $in: user.businessPointCards },
      isDeleted: false,
    });
  }

  async findAllbyUserCompany(companyID: string): Promise<BusinessPointCard[]> {
    return this.businessPointCardModel
      .find({
        company: companyID,
        isDeleted: false,
      })
      .populate('company')
      .exec();
  }

  async findOne(id: string): Promise<BusinessPointCard> {
    // Überprüfen, ob die ID ein gültiges MongoDB ObjectId-Format hat
    if (!Types.ObjectId.isValid(id)) {
      throw new InvalidObjectIdException(id, this.i18n);
    }

    const pointCard = await this.businessPointCardModel.findOne({ _id: id });
    if (!pointCard) {
      throw new PointCardNotFoundException(id, this.i18n);
    }
    return pointCard;
  }

  async delete(userId: string, pointCardId: string): Promise<void> {
    if (!Types.ObjectId.isValid(pointCardId)) {
      throw new InvalidObjectIdException(pointCardId, this.i18n);
    }

    //check first if ther is a existin customerPointCard if yes set deleted flag if not delete the pointCard

    const existingCustomerPointCard =
      await this.customerPointCardService.checkIfPointCardHasExistingCustomerPointCard(
        pointCardId,
      );

    if (existingCustomerPointCard) {
      await this.customerPointCardService.setDeletedFlagByPointCardId(
        pointCardId,
      );

      await this.setDeletedFlagById(pointCardId);
    } else {
      const deletedCard =
        await this.businessPointCardModel.findByIdAndRemove(pointCardId);

      if (!deletedCard) {
        throw new PointCardNotFoundException(pointCardId, this.i18n);
      }

      await this.appUserService.removeBusinessPointCardFromUserById(
        userId,
        pointCardId,
      );
    }
  }

  async deleteAllFromList(ids: string[]): Promise<void> {
    await this.businessPointCardModel.deleteMany({ _id: { $in: ids } });
  }

  async findPointCardByCompanyId(
    pointCradId: string,
    companyId: string,
  ): Promise<BusinessPointCard> {
    return await this.businessPointCardModel.findOne({
      _id: pointCradId,
      company: companyId,
    });
  }

  async updatePointCard(
    pointCardUpdateDto: BusinessPointCardUpdateDTO,
    requestUser: AppUser,
    pointCradId: string,
  ): Promise<BusinessPointCard> {
    //check if exists
    const pointCard = await this.businessPointCardModel.findOne({
      _id: pointCradId,
    });

    if (!pointCard) {
      throw new PointCardNotFoundException(pointCradId, this.i18n);
    }

    //ceck if user is owner of Point Card
    if (pointCard.company != requestUser.company) {
      throw new UserNotOwnerOfPointcardException(pointCradId, this.i18n);
    }

    // Iteriere über die Schlüssel des DTO und aktualisiere nur die vorhandenen Attribute
    Object.keys(pointCardUpdateDto).forEach((key) => {
      if (pointCardUpdateDto[key] !== undefined) {
        // Prüfe, ob der Wert im DTO definiert ist
        pointCard[key] = pointCardUpdateDto[key];
      }
    });

    return await pointCard.save();
  }
  async setDeletedFlagById(pointCardId: string): Promise<void> {
    await this.businessPointCardModel.updateOne(
      { _id: pointCardId },
      { $set: { isDeleted: true } },
    );
  }
}
