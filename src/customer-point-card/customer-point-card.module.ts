import { forwardRef, Module } from '@nestjs/common';
import { CustomerPointCardService } from './customer-point-card.service';
import { CustomerPointCardController } from './customer-point-card.controller';
import { CustomerPointCardSchema } from './customer-point-card.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AppUserModule } from '../appUser/appUser.module';
import { PointCardModule } from '../point-card/point-card.module';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CompanyModule } from '../company/company.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'CustomerPointCard', schema: CustomerPointCardSchema },
    ]),
    AppUserModule,
    forwardRef(() => PointCardModule),
    CompanyModule,
    SseModule,
  ],
  providers: [
    CustomerPointCardService,
    {
      provide: 'QR_POINTREDEEM_SERVICE', // Benutzerdefinierte Bezeichnung
      useFactory: (configService: ConfigService) => {
        // Erstelle eine neue Instanz des JwtService mit der entsprechenden Konfiguration
        return new JwtService({
          secret: configService.get<string>('JWT_SECRET'), // Ersetzen Sie dies durch den richtigen Schlüsselnamen aus Ihren Umgebungsvariablen
          signOptions: {},
        });
      },
      inject: [ConfigService], // Die notwendigen Abhängigkeiten für den benutzerdefinierten Provider
    },
  ],
  controllers: [CustomerPointCardController],
  exports: [CustomerPointCardService],
})
export class CustomerPointCardModule {}
