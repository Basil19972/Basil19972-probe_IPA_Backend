import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offer } from './offer.schema';
import { CreateOfferDto } from './DTO/createOfferDto';
import { AppUser } from '../appUser/appUser.schema';
import { JwtService } from '@nestjs/jwt';
import { OfferLimitReachedException } from '../exceptions/offer-scan-limit-reached.exception';
import { I18nService } from 'nestjs-i18n';
import { MaxTimeOffer } from './maxTimeOffer.enum';
import { OfferNotFoundException } from '../exceptions/offer-not-found.exception';
import { OfferStartDateIsInPastException } from '../exceptions/offer-start-date-is-in-past.exception';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel('Offer')
    private readonly offerModel: Model<Offer>,
    @Inject('OFFER_JWT_SERVICE')
    private readonly offerJwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async createOffer(
    appuser: AppUser,
    createOfferDto: CreateOfferDto,
  ): Promise<Offer> {
    //check if createOfferDto.startDate is in the past

    const now = new Date();
    if (new Date(createOfferDto.startDate) < now) {
      throw new OfferStartDateIsInPastException(this.i18n);
    }

    const createdOffer = new this.offerModel({
      ...createOfferDto,
      company: appuser.company,
    });

    const endDate = this.calculateEndDate(
      new Date(createOfferDto.startDate),
      appuser.roles[0],
    );
    createdOffer.endDate = endDate;

    //berrechne end time anhand von enum und rolle

    const token = await this.createOfferToken(
      createdOffer._id,
      createdOffer.amountOfScans,
      createdOffer.customerLevelRange,
      endDate,
    );

    createdOffer.offerToken = token;

    return createdOffer.save();
  }

  private calculateEndDate(startDate: Date, userRole: string): Date {
    const roleDurationHours = MaxTimeOffer[userRole]; // Holen Sie die Stunden aus dem Enum basierend auf der Benutzerrolle
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + roleDurationHours);
    return endDate;
  }

  async createOfferToken(
    offerId: string,
    amountOfScans: number,
    customerLevelRange: [number],
    endDate: Date,
  ): Promise<string> {
    //sign so konfigurieren das ein ablaufdatum gewählt wurde im dto und das token dan so lange gültig ist
    const payload = {
      offerId: offerId,
      amountOfScans: amountOfScans,
      customerLevelRange: customerLevelRange,
    };

    // Aktuelles Datum + Ablaufdatum in Sekunden
    const now = new Date();
    const expiresIn = Math.floor((endDate.getTime() - now.getTime()) / 1000);

    const token = this.offerJwtService.sign(payload, {
      expiresIn: expiresIn,
    });

    return token;
  }

  async scanOffer(appuser: AppUser, offerToken: string): Promise<Offer> {
    const offer = await this.offerModel.findOne({ offerToken: offerToken });
    if (!offer) {
      throw new OfferNotFoundException(this.i18n);
    }

    const payload = this.offerJwtService.verify(offerToken);

    // Suche nach einem UserScan für den aktuellen Benutzer
    const userScanIndex = offer.userScans.findIndex((us) =>
      us.appUser.equals(appuser._id),
    );

    if (userScanIndex === -1) {
      // Benutzer hat noch keinen Scan, füge neuen Eintrag hinzu
      offer.userScans.push({ appUser: appuser._id, scanCount: 1 });
    } else {
      // Überprüfen, ob amountOfScans im Payload existiert
      if (payload.amountOfScans) {
        // Benutzer hat bereits gescannt, erhöhe den Zähler, wenn das Limit noch nicht erreicht ist
        if (offer.userScans[userScanIndex].scanCount < payload.amountOfScans) {
          offer.userScans[userScanIndex].scanCount++;
        } else {
          throw new OfferLimitReachedException(this.i18n);
        }
      } else {
        // Kein Limit gesetzt, zähle einfach den Scan
        offer.userScans[userScanIndex].scanCount++;
      }
    }

    await offer.save();
    return offer;
  }
}
