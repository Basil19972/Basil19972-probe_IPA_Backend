// qr-code.module.ts
import { Module } from '@nestjs/common';
import { AppUserModule } from '../appUser/appUser.module';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [AppUserModule, HttpModule],
  providers: [StripeWebhookService],
  exports: [StripeWebhookService],
  controllers: [StripeWebhookController],
})
export class StripeWebhookModule {}
