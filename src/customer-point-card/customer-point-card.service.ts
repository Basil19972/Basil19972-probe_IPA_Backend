import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { AppUserService } from '../appUser/appUser.service';
import { CompanyService } from '../company/company.service';
import { BusinessToCustomerPointCardNotFoundException } from '../exceptions/business-to-customer-point-card-not-found.exception';
import { CustomerPointCardCreationException } from '../exceptions/customer-point-card-creation.exception';
import { CustomerPointCardNotFoundException } from '../exceptions/customer-point-card-not-found.exception';
import { CustomerPointCardNotFullException } from '../exceptions/customer-point-card-not-full.exception';
import { InvalidObjectIdException } from '../exceptions/invalid-objectId.exception';
import { InvalidTokenSignatureException } from '../exceptions/invalid-token-signature.exception';
import { PointCardNotFoundException } from '../exceptions/point-card-not-found.exception';
import { TokenAlreadyUsedException } from '../exceptions/token-already-used.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { UserNotOwnerOfPointcardException } from '../exceptions/user-not-owner-of-pointcard.exception';
import { MessageEvent, SseService } from '../sse/sse.service';
import { CustomerPointCardUpdateDto } from './DTO/CustomerPointCardUpdateDTO';
import { CustomerPointCardDTO } from './customer-point-card-DTO';
import { CustomerPointCard, Point } from './customer-point-card.schema';
import { PointCardService } from '../point-card/point-card.service';

export interface Request {
  user?: any; // oder ein spezifischeres Interface
}
@Injectable()
export class CustomerPointCardService {
  constructor(
    @InjectModel('CustomerPointCard')
    private readonly customerPointCardModel: Model<CustomerPointCard>,
    readonly appUserService: AppUserService,
    @Inject('QR_POINTREDEEM_SERVICE')
    private readonly jwtPointReedeemService: JwtService,
    private readonly i18n: I18nService,
    private readonly companyService: CompanyService,
    private readonly sseService: SseService,
    @Inject(forwardRef(() => PointCardService))
    private readonly businessPointCardService: PointCardService,
  ) {}

  async create(
    customerPointCardDTO: CustomerPointCardDTO,
    requestUserID: string,
  ): Promise<CustomerPointCard> {
    // check if pointCardID exists in database

    const businessPointCard = await this.businessPointCardService.findOne(
      customerPointCardDTO.pointCardID,
    );
    if (!businessPointCard) {
      throw new PointCardNotFoundException(
        customerPointCardDTO.pointCardID,
        this.i18n,
      );
    }
    const customerPointCard = new this.customerPointCardModel({
      pointCard: customerPointCardDTO.pointCardID,
      points: [], // Keine Punkte beim Erstellen
    });
    try {
      await customerPointCard.save();
      const userId = requestUserID;
      await this.appUserService.updateAppUserCustomerPointCard(
        userId,
        customerPointCard._id,
      );
      return customerPointCard;
    } catch (error) {
      throw new CustomerPointCardCreationException(error.message, this.i18n);
    }
  }

  async findAllByUser(
    requestUserID: string,
    redeemed?: boolean,
  ): Promise<CustomerPointCard[]> {
    const userId = requestUserID;
    const user = await this.appUserService.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }
    return await this.customerPointCardModel
      .find({
        _id: { $in: user.customerPointCards },
        pointCradIsDeleted: false,
        ...(redeemed !== undefined && { isScanned: redeemed }),
      })
      .select('-createdAt -updatedAt -__v')
      .populate({
        path: 'pointCard',
        select: '-createdAt -updatedAt -__v',
        populate: {
          path: 'company',
          model: 'Company',
          select: '_id companyName location logoSvg companyColor',
        },
      });
  }

  async updatePointsByUser(
    userId: string,
    points: number,
    businessCardId: string,
    pointCreatorID: string,
  ): Promise<CustomerPointCardUpdateDto> {
    // Benutzer anhand der userId finden
    const user = await this.appUserService.findById(userId);

    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }

    // Alle CustomerPointCards für diesen Benutzer abrufen
    const userPointCards = await this.customerPointCardModel.find({
      _id: { $in: user.customerPointCards },
    });

    // Überprüfen, ob irgendeine der CustomerPointCards die gesuchte pointCardId hat
    const hasBusinessPointCard = userPointCards.some(
      (pointCard) => pointCard.pointCard.toString() === businessCardId,
    );

    if (!hasBusinessPointCard) {
      //neue CustomerPointCard erstellen

      const customerPointCard = new this.customerPointCardModel({
        pointCard: businessCardId,
        points: [],
      });
      await customerPointCard.save();
      // und dem Benutzer hinzufügen
      await this.appUserService.updateAppUserCustomerPointCard(
        userId,
        customerPointCard._id,
      );
    }

    const user2 = await this.appUserService.findById(userId);

    const userPointCards2 = await this.customerPointCardModel.find({
      _id: { $in: user2.customerPointCards },
    });

    // Finden der CustomerPointCard des Benutzers für die gegebene BusinessPointCard

    const customerPointCard = userPointCards2.find(
      (card) =>
        card.pointCard.toString() === businessCardId && !card.hasFullPoints,
    );

    if (!customerPointCard) {
      throw new BusinessToCustomerPointCardNotFoundException(
        businessCardId,
        this.i18n,
      );
    }

    const businessPointCard =
      await this.businessPointCardService.findOne(businessCardId);

    return await this.calculateNewPoints(
      userId,
      customerPointCard.points,
      businessPointCard.maxpoints,
      businessCardId,
      customerPointCard,
      points,
      pointCreatorID,
    );
  }

  async calculateNewPoints(
    userId: string,
    currentPoints: Point[], // currentPoints ist jetzt ein Array von Point-Objekten
    maxPoints: number,
    businessCardId: string,
    customerPointCard: CustomerPointCard,
    newPoints: number,
    pointCreatorID: string,
  ): Promise<CustomerPointCardUpdateDto> {
    const newCustomerPointCards: CustomerPointCard[] = []; // Ein Array für neu erstellte Karten

    // Berechne die Gesamtanzahl der aktuellen Punkte
    const currentPointsTotal = currentPoints.reduce(
      (sum, point) => sum + point.value,
      0,
    );
    let remainingPoints = newPoints + currentPointsTotal;

    const pointCreatorId = new Types.ObjectId(pointCreatorID);

    // Hinzufügen von neuen Punkten zu den aktuellen Punkten
    const updatePointsArray = (pointsCount: number) =>
      Array.from(
        { length: pointsCount },
        () => new Point({ pointCreatorID: pointCreatorId }),
      );

    // Berechne die Anzahl der neuen Punkte, die hinzugefügt werden müssen
    const pointsForCurrentCard = Math.min(remainingPoints, maxPoints);
    const newPointsToAdd = pointsForCurrentCard - currentPoints.length;
    const newPointsArray =
      newPointsToAdd > 0 ? updatePointsArray(newPointsToAdd) : [];

    // Update current card nur, wenn es neue Punkte zu addieren gibt
    const updatedCustomerPointCard =
      await this.customerPointCardModel.findOneAndUpdate(
        { _id: customerPointCard._id }, // finde das Dokument basierend auf der ID
        {
          $push: { points: { $each: newPointsArray } }, // Füge nur neue Punkte hinzu
          hasFullPoints: pointsForCurrentCard === maxPoints,
          cardIsFullToken: await this.createPointsIsFullToken(
            customerPointCard._id,
            userId,
            businessCardId,
          ),
        },
        {
          populate: {
            path: 'pointCard',
            populate: 'company',
          },
          new: true, // Gibt das aktualisierte Dokument zurück statt das ursprüngliche
        },
      );

    remainingPoints -= pointsForCurrentCard;

    // Create new cards if necessary
    let cardCreatedInThisIteration = pointsForCurrentCard === maxPoints;
    while (remainingPoints > 0 || cardCreatedInThisIteration) {
      const pointsForNewCard = Math.min(remainingPoints, maxPoints);
      const newPointsArrayForNewCard = updatePointsArray(pointsForNewCard);
      const newCustomerPointCard = new this.customerPointCardModel({
        points: newPointsArrayForNewCard,
        pointCard: businessCardId,
        hasFullPoints: pointsForNewCard === maxPoints,
      });
      newCustomerPointCard.cardIsFullToken = await this.createPointsIsFullToken(
        newCustomerPointCard._id,
        userId,
        businessCardId,
      );
      await newCustomerPointCard.save();

      newCustomerPointCards.push(newCustomerPointCard);

      // Hier aktualisieren wir die AppUser-Entität
      await this.appUserService.updateAppUserCustomerPointCard(
        userId,
        newCustomerPointCard._id,
      );

      remainingPoints -= pointsForNewCard;
      cardCreatedInThisIteration = pointsForNewCard === maxPoints;
    }
    const customerPointCardUpdateDto = new CustomerPointCardUpdateDto();

    // Werte zuweisen
    customerPointCardUpdateDto.updatedCard = updatedCustomerPointCard;
    customerPointCardUpdateDto.newCards = await Promise.all(
      newCustomerPointCards.map((c) =>
        c.populate({
          path: 'pointCard',
          populate: 'company',
        }),
      ),
    );
    // Das DTO-Objekt zurückgeben

    await this.updateAppUserLevel(userId);

    return customerPointCardUpdateDto;
  }

  async deleteAllFromList(customerPointCardIds: string[]): Promise<void> {
    await this.customerPointCardModel.deleteMany({
      _id: { $in: customerPointCardIds },
    });
  }

  async deleteByBusinessPointCardIds(
    businessPointCardIds: string[],
  ): Promise<void> {
    await this.customerPointCardModel.deleteMany({
      pointCard: { $in: businessPointCardIds },
    });
  }

  async findAllWhereBusinessPointCardIdIn(
    businessPointCardIds: string[],
  ): Promise<CustomerPointCard[]> {
    return await this.customerPointCardModel.find({
      pointCard: { $in: businessPointCardIds },
    });
  }

  async deleteById(customerPointCardID: string): Promise<void> {
    if (!Types.ObjectId.isValid(customerPointCardID)) {
      throw new InvalidObjectIdException(customerPointCardID, this.i18n);
    }

    const id = new Types.ObjectId(customerPointCardID);
    const result = await this.customerPointCardModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new CustomerPointCardNotFoundException(
        customerPointCardID,
        this.i18n,
      );
    }
  }

  async createPointsIsFullToken(
    customerPointCardID: string,
    userID: string,
    pointCradID: string,
  ): Promise<string> {
    const payload = {
      customerPointCardId: customerPointCardID,
      poinCradId: pointCradID,
      userId: userID,
    };
    const token = await this.jwtPointReedeemService.sign(payload);
    return token;
  }

  async decodePointsIsFullToken(
    token: string,
    requestUserId: string,
  ): Promise<CustomerPointCard> {
    const decoded = this.jwtPointReedeemService.verify(token);
    if (!decoded) {
      throw new InvalidTokenSignatureException(this.i18n);
    }

    // check if user is owner form CustomerPointCard token
    const isOwner = await this.checkIfUserIsOwnerOfPointCard(
      decoded.customerPointCardId,
      requestUserId,
    );
    if (!isOwner) {
      throw new UserNotOwnerOfPointcardException(requestUserId, this.i18n);
    }

    const customerPointCard = await this.customerPointCardModel
      .findOne({
        _id: decoded.customerPointCardId,
      })
      .populate({
        path: 'pointCard',
        select: '-createdAt -updatedAt -__v',
        populate: {
          path: 'company',
          model: 'Company',
          select: '_id companyName location logoSvg ',
        },
      });

    if (!customerPointCard) {
      throw new CustomerPointCardNotFoundException(
        decoded.customerPointCardId,
        this.i18n,
      );
    }
    if (customerPointCard.isScanned) {
      throw new TokenAlreadyUsedException(this.i18n);
    } else {
      if (customerPointCard.hasFullPoints) {
        await this.customerPointCardModel.updateOne(
          { _id: decoded.customerPointCardId },
          { isScanned: true },
        );

        // send SSE event to user

        const event: MessageEvent = {
          data: 'CustomerPointCard successfully redeemed',
          type: 'redeemSuccess',
        };

        this.sseService.sendEventToUser(decoded.userId, event);

        return customerPointCard;
      } else {
        throw new CustomerPointCardNotFullException(this.i18n);
      }
    }
  }

  async checkIfUserIsOwnerOfPointCard(
    customerPointCardId: string,
    userId: string,
  ): Promise<boolean> {
    // Zuerst holen wir die CustomerPointCard
    const customerPointCard = await this.customerPointCardModel
      .findOne({
        _id: new Types.ObjectId(customerPointCardId),
      })
      .populate('pointCard');

    // Wenn die CustomerPointCard nicht existiert, werfen wir einen Fehler
    if (!customerPointCard) {
      throw new CustomerPointCardNotFoundException(
        customerPointCardId,
        this.i18n,
      );
    }

    // Dann holen wir den User
    const user = await this.appUserService.findById(userId);

    // Wenn der User nicht existiert, werfen wir einen Fehler
    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }

    // Überprüfen, ob die pointCardId der CustomerPointCard in der businessPointCards-Liste des Users vorhanden ist
    const isOwner =
      (user.company ?? user.employee[0]?.companyId) ==
      (customerPointCard.pointCard as any).company;

    // Rückgabe des Ergebnisses
    return isOwner;
  }

  async updateAppUserLevel(appUserID: string): Promise<void> {
    const newTotalPoints =
      await this.getAllCustomerPointCardPointsByAppUserId(appUserID);

    await this.companyService.updateOrCreateCustomerLevel(
      appUserID,
      newTotalPoints,
    );
  }

  async getAllCustomerPointCardPointsByAppUserId(
    appUserId: string,
  ): Promise<number> {
    const appUser = await this.appUserService.findById(appUserId);

    if (
      !appUser ||
      !appUser.customerPointCards ||
      appUser.customerPointCards.length === 0
    ) {
      return 0;
    }

    const result = await this.customerPointCardModel.aggregate([
      { $match: { _id: { $in: appUser.customerPointCards } } },
      { $unwind: '$points' },
      { $group: { _id: null, totalPoints: { $sum: '$points.value' } } },
    ]);

    return result[0]?.totalPoints || 0;
  }

  async getPointsByPointCardAndDateApprox(
    businessPointCardId: string,
    startDate: Date,
  ): Promise<Point[]> {
    // Finde alle CustomerPointCards basierend auf businessPointCardId
    const customerPointCards = await this.customerPointCardModel
      .find({ pointCard: businessPointCardId })
      .populate('points')
      .exec();

    // Filtere die Punkte manuell
    const filteredPoints = [];
    customerPointCards.forEach((card) => {
      card.points.forEach((point) => {
        if (point.createdAt && point.createdAt >= startDate) {
          filteredPoints.push(point);
        }
      });
    });

    return filteredPoints;
  }

  async getAllPoints(businessPointCardId: string): Promise<Point[]> {
    // Finde alle CustomerPointCards basierend auf businessPointCardId und gib alle Punkte zurück
    const customerPointCards = await this.customerPointCardModel
      .find({ pointCard: businessPointCardId })
      .populate('points')
      .exec();

    const allPoints = [];
    customerPointCards.forEach((card) => {
      allPoints.push(...card.points);
    });

    return allPoints;
  }

  async aggregatePoints(aggregationPipeline: any[]): Promise<any[]> {
    return await this.customerPointCardModel.aggregate(aggregationPipeline);
  }

  async countTotalPoints(businessPointCardId: string): Promise<number> {
    const result = await this.customerPointCardModel.aggregate([
      {
        $match: {
          pointCard: new Types.ObjectId(businessPointCardId).toString(), // Vergleiche mit ObjectId, kein .toString() nötig
        },
      },
      {
        $unwind: '$points', // Entpacke das Array "points", um mit jedem Punkt einzeln zu arbeiten
      },
      {
        $group: {
          _id: null, // Gruppiert alle Dokumente zusammen
          totalPoints: { $sum: 1 }, // Zählt die Anzahl der verarbeiteten Dokumente (Punkte)
        },
      },
    ]);

    if (result.length > 0) {
      return result[0].totalPoints;
    } else {
      return 0;
    }
  }

  async determineDynamicAggregationStage(businessPointCardId: string) {
    // Aggregationspipeline, um das älteste und das neueste Punktedokument zu finden
    const pipeline: PipelineStage[] = [
      { $match: { pointCard: businessPointCardId } }, // Filtere nach der businessPointCardId
      { $unwind: '$points' }, // Trenne das Array in einzelne Dokumente auf
      { $sort: { 'points.createdAt': 1 } }, // Sortiere nach createdAt aufsteigend
      {
        $group: {
          _id: '$pointCard', // Gruppiere wieder nach pointCard
          oldestPoint: { $first: '$points' }, // Das erste Dokument nach der Sortierung ist das älteste
          newestPoint: { $last: '$points' }, // Das letzte Dokument nach der Sortierung ist das neueste
        },
      },
    ];

    const result = await this.customerPointCardModel.aggregate(pipeline).exec();

    if (
      !result ||
      result.length === 0 ||
      !result[0].oldestPoint ||
      !result[0].newestPoint
    ) {
      // Handle the case where there are no points
      return null;
    }

    const oldestPoint = result[0].oldestPoint;
    const newestPoint = result[0].newestPoint;

    const timeDiff =
      newestPoint.createdAt.getTime() - oldestPoint.createdAt.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Implementieren Sie hier Ihre Logik zur Bestimmung der Aggregationsstufe
    return hoursDiff; // Oder die berechnete Aggregationsstufe zurückgeben
  }

  async setDeletedFlagByPointCardId(pointCardId: string): Promise<void> {
    await this.customerPointCardModel.updateMany(
      { pointCard: pointCardId },
      { $set: { pointCradIsDeleted: true } },
    );
  }

  async checkIfPointCardHasExistingCustomerPointCard(
    pointCardId: string,
  ): Promise<boolean> {
    const result = await this.customerPointCardModel.exists({
      pointCard: pointCardId,
    });

    return result != null;
  }
}
