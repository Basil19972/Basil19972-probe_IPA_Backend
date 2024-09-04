import { Module } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { offerSchema } from './offer.schema';
import { AppUserModule } from '../appUser/appUser.module';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Offer', schema: offerSchema }]),
    AppUserModule,
  ],
  providers: [
    OfferService,
    {
      provide: 'OFFER_JWT_SERVICE',
      useFactory: (configService: ConfigService) => {
        return new JwtService({
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '15m' },
        });
      },
      inject: [ConfigService],
    },
  ],
  controllers: [OfferController],
})
export class OfferModule {}
