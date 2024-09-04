// qr-code.module.ts
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QrCodeService } from './qr-code.service';
import { QrCodeController } from './qr-code.controller';
import { AppUserModule } from '../appUser/appUser.module';
import { MongooseModule } from '@nestjs/mongoose';
import { QRCodeSchema } from './qr-code.schema';
import { CustomerPointCardModule } from '../customer-point-card/customer-point-card.module';
import { PointCardModule } from '../point-card/point-card.module';
import { CompanyModule } from '../company/company.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    ConfigModule,
    AppUserModule,
    CompanyModule,
    CustomerPointCardModule,
    MongooseModule.forFeature([{ name: 'QRCode', schema: QRCodeSchema }]),
    PointCardModule,
    SseModule,
  ],
  providers: [
    QrCodeService,
    {
      provide: 'QR_JWT_SERVICE', // Benutzerdefinierte Bezeichnung
      useFactory: (configService: ConfigService) => {
        // Erstelle eine neue Instanz des JwtService mit der entsprechenden Konfiguration
        return new JwtService({
          secret: configService.get<string>('JWT_SECRET'), // Ersetzen Sie dies durch den richtigen Schlüsselnamen aus Ihren Umgebungsvariablen
          signOptions: { expiresIn: '1h' },
        });
      },
      inject: [ConfigService], // Die notwendigen Abhängigkeiten für den benutzerdefinierten Provider
    },
  ],
  exports: ['QR_JWT_SERVICE', QrCodeService], // Exportieren Sie den benutzerdefinierten Provider
  controllers: [QrCodeController],
})
export class QrCodeModule {}
