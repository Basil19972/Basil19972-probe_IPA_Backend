import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { AppUser } from '../appUser/appUser.schema';
import { AppUserService } from '../appUser/appUser.service';
import { UserRole } from '../appUser/role.enum';
import { CompanyService } from '../company/company.service';
import { CustomerPointCardUpdateDto } from '../customer-point-card/DTO/CustomerPointCardUpdateDTO';
import { CustomerPointCardService } from '../customer-point-card/customer-point-card.service';
import { InvalidOrExpiredQrTokenException } from '../exceptions/qr-token-invalide.exception';
import { QrTokenNotAuthorizedToCreateException } from '../exceptions/qr-token-not-authorized-to-create.expection';
import { TokenMismatchWithDatabaseException } from '../exceptions/token-mismatch-with-Database.exception';
import { TokenNotFoundInDatabaseException } from '../exceptions/token-not-found-in-database.exception';
import { MessageEvent, SseService } from '../sse/sse.service';
import { QRCodeDTO } from './DTO/qr-code-DTO';
import { QRCode } from './qr-code.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class QrCodeService {
  constructor(
    @InjectModel('QRCode') private readonly qRCodeModel: Model<QRCode>,
    private readonly customerPointCardService: CustomerPointCardService,
    private readonly companyService: CompanyService,
    private readonly appUserService: AppUserService,
    private readonly sseService: SseService,
    @Inject('QR_JWT_SERVICE') private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async generateQrCode(
    qRCodeDTO: QRCodeDTO,
    requestUser: AppUser,
  ): Promise<string> {
    if (
      requestUser.roles.includes(UserRole.Employee) ||
      requestUser.roles.includes(UserRole.User)
    ) {
      const user = await this.appUserService.findAppUserByPointCardId(
        qRCodeDTO.businessPointCardID,
      );

      const company = await this.companyService.getCompanyById(
        user.company.toString(),
      );

      if (!company.employeesAppUsersIds.includes(requestUser._id.toString())) {
        throw new QrTokenNotAuthorizedToCreateException(this.i18n);
      }
    } else {
      if (
        !requestUser.businessPointCards.includes(
          new Types.ObjectId(qRCodeDTO.businessPointCardID),
        )
      ) {
        throw new QrTokenNotAuthorizedToCreateException(this.i18n);
      }
    }

    const payload = JSON.parse(
      JSON.stringify({
        ...qRCodeDTO,
        pointCreatorID: requestUser._id,
      }),
    );
    const token = this.jwtService.sign(payload);

    const qRCode = new this.qRCodeModel({
      businessAppUserID: new Types.ObjectId(requestUser._id),
      points: qRCodeDTO.points,
      token: token,
      businessPointCardID: new Types.ObjectId(qRCodeDTO.businessPointCardID),
    });

    await qRCode.save();

    return token;
  }

  async deleteByUserId(userId: string): Promise<void> {
    const appuserId = new Types.ObjectId(userId);

    await this.qRCodeModel.deleteMany({ businessAppUserID: appuserId });
  }

  async decodeQrToken(
    token: string,
    requestUserID: string,
  ): Promise<CustomerPointCardUpdateDto> {
    const decoded = this.verifyToken(token);
    // const savedToken = await this.findSavedToken(decoded);

    const savedToken = await this.qRCodeModel.findOne({
      token: token,
    });

    //await this.compareTokens(token, savedToken);

    await this.qRCodeModel.deleteOne({ _id: savedToken._id });
    const response = await this.customerPointCardService.updatePointsByUser(
      requestUserID,
      decoded.points,
      decoded.businessPointCardID,
      decoded.pointCreatorID,
    );

    //send event to PointCreator
    const event: MessageEvent = {
      data: 'QRCode successfully scanned',
      type: 'scanSuccess',
    };

    this.sseService.sendEventToUser(decoded.pointCreatorID, event);

    return response;
  }

  private verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      throw new InvalidOrExpiredQrTokenException(this.i18n);
    }
  }

  private async findSavedToken(decoded) {
    const savedToken = await this.qRCodeModel.findOne({
      businessPointCardID: new Types.ObjectId(decoded.businessPointCardID),
    });
    if (!savedToken) {
      throw new TokenNotFoundInDatabaseException(this.i18n);
    }
    return savedToken;
  }

  private async compareTokens(token: string, savedToken) {
    const isMatch = await bcrypt.compare(token, savedToken.token);
    if (!isMatch) {
      throw new TokenMismatchWithDatabaseException(this.i18n);
    }
  }
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredQRCodeTokens(): Promise<void> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Berechnet das Datum von 1 Tag vor jetzt

    await this.qRCodeModel.deleteMany({
      createdAt: { $lt: oneDayAgo },
    });
  }
}
