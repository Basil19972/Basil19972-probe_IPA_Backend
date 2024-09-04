import { Injectable } from '@nestjs/common';
import { AppUserService } from '../appUser/appUser.service';
import { CompanyService } from '../company/company.service';
import { CustomerPointCardService } from '../customer-point-card/customer-point-card.service';
import { UserDataCleanupException } from '../exceptions/user-data-cleanup.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { PointCardService } from '../point-card/point-card.service';
import { QrCodeService } from '../qr-code/qr-code.service';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { I18nService } from 'nestjs-i18n';
import { AppUser } from '../appUser/appUser.schema';
import { Types } from 'mongoose';
import { UserRole } from '../appUser/role.enum';

@Injectable()
export class UserDataCleanupService {
  constructor(
    private readonly refresgTokenService: RefreshTokenService,
    private readonly companyService: CompanyService,
    private readonly appUserService: AppUserService,
    private readonly pointCardService: PointCardService,
    private readonly customerPointCardService: CustomerPointCardService,
    private readonly qrCodeService: QrCodeService,
    private readonly i18n: I18nService,
  ) {}

  async delete(appUser: AppUser) {
    if (appUser.roles.includes(UserRole.Owner)) {
      await this.cleanAllUserData(appUser._id);
    } else if (appUser.roles.includes(UserRole.User)) {
      await this.setDeletedToUserData(appUser._id);
    }
  }

  async cleanAllUserData(userId: string) {
    // get User by ID
    const user = await this.appUserService.findById(userId);

    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }

    try {
      await this.pointCardService.deleteAllFromList(
        user.businessPointCards.map((id) => id.toString()),
      );
      await this.appUserService.deleteEmployeesByCompanyIds([user.company]);
      await this.companyService.deleteById(user.company);
      await this.refresgTokenService.deleteRefreshTokenByUserId(userId);
      await this.customerPointCardService.deleteAllFromList(
        user.customerPointCards.map((id) => id.toString()),
      );
      await this.qrCodeService.deleteByUserId(userId);
      await this.appUserService.deleteById(user._id);

      //delete all customerPointCards from user where businessPointCardId is related
      const customerPointCards =
        await this.customerPointCardService.findAllWhereBusinessPointCardIdIn(
          user.businessPointCards.map((id) => id.toString()),
        );

      await this.appUserService.removeAllCustomerPointCardsFromUsers(
        customerPointCards.map((customerPointCard) => customerPointCard._id),
      );

      //delete all customerPointCards where businessPointCardId is related
      await this.customerPointCardService.deleteByBusinessPointCardIds(
        user.businessPointCards.map((id) => id.toString()),
      );
    } catch (error) {
      throw new UserDataCleanupException(error.message, this.i18n);
    }
  }

  async cleanAllEmployeeData(appUser: AppUser, employeeId: string) {
    const company = await this.companyService.findCompanyById(
      appUser.company.toString(),
    );

    const isWorker = company.employeesAppUsersIds.includes(
      new Types.ObjectId(employeeId),
    );
    if (!isWorker) {
      throw new UserDataCleanupException(
        'Employee not found in company',
        this.i18n,
      );
    }

    await this.companyService.removeEmployee(
      appUser.company.toString(),
      employeeId,
    );

    await this.cleanAllUserData(employeeId);
  }

  async setDeletedToUserData(userId: string) {
    const user = await this.appUserService.findById(userId);

    if (!user) {
      throw new UserNotFoundException(userId, this.i18n);
    }

    try {
      await this.appUserService.setUserAsDeleted(user._id);
    } catch (error) {
      throw new UserDataCleanupException(error.message, this.i18n);
    }
  }
}
