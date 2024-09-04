import { Module } from '@nestjs/common';
import { UserDataCleanupService } from './user-data-cleanup.service';
import { CustomerPointCardModule } from '../customer-point-card/customer-point-card.module';
import { PointCardModule } from '../point-card/point-card.module';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';
import { CompanyModule } from '../company/company.module';
import { AppUserModule } from '../appUser/appUser.module';
import { UserDataCleanupController } from './user-data-cleanup.controller';
import { QrCodeModule } from '../qr-code/qr-code.module';

@Module({
  imports: [
    AppUserModule,
    CustomerPointCardModule,
    PointCardModule,
    RefreshTokenModule,
    CompanyModule,
    QrCodeModule,
  ],
  providers: [UserDataCleanupService],
  controllers: [UserDataCleanupController],
})
export class UserDataCleanupModule {}
