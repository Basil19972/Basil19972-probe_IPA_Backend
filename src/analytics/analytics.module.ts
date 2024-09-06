import { AnalyticsController } from './analytics.controller';
import { AppUserModule } from '../appUser/appUser.module';
import { PointCardModule } from '../point-card/point-card.module';
import { CustomerPointCardModule } from '../customer-point-card/customer-point-card.module';
import { AnalyticsService } from './analytics.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [AppUserModule, PointCardModule, CustomerPointCardModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
