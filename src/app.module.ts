import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PointCardModule } from './point-card/point-card.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppUserModule } from './appUser/appUser.module';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { CustomerPointCardModule } from './customer-point-card/customer-point-card.module';
import { QrCodeModule } from './qr-code/qr-code.module';
import { CompanyModule } from './company/company.module';
import { UserDataCleanupModule } from './user-data-cleanup/user-data-cleanup.module';
import { MailModule } from './mail/mail.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { StripeWebhookModule } from './stripe-webhook/stripe-webhook.module';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { DevInterfaceModule } from './dev-interface/dev-interface.module';
import { OfferModule } from './offer/offer.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SseController } from './sse/sse.controller';
import { SseService } from './sse/sse.service';
import { SseModule } from './sse/sse.module';
import { ContactModule } from './contact/contact.module';
import * as path from 'path';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomThrottlerGuard } from './security/customThrottler.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang', 'l']),
        new HeaderResolver(['x-custom-lang']),
        new CookieResolver(),
        AcceptLanguageResolver,
      ],
    }),
    // Import ConfigModule to use .env file globally
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_URI),
    PointCardModule,
    AppUserModule,
    RefreshTokenModule,
    CustomerPointCardModule,
    QrCodeModule,
    CompanyModule,
    UserDataCleanupModule,
    MailModule,
    StripeWebhookModule,
    DevInterfaceModule,
    OfferModule,
    AnalyticsModule,
    SseModule,
    ContactModule,
  ],

  controllers: [AppController, SseController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    SseService,
  ],
})
export class AppModule {}
