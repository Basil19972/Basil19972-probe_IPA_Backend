import { Module, forwardRef } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenSchema } from './refreshToken.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshTokenController } from './refresh-token.controller';
import { JwtRefreshTokenStrategy } from './JwtRefreshTokenStrategy';
import { AppUserModule } from '../appUser/appUser.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RefreshToken', schema: RefreshTokenSchema },
    ]),
    forwardRef(() => AppUserModule),
    ConfigModule, // Importiere ConfigModule, wenn es noch nicht importiert wurde
  ],
  providers: [
    RefreshTokenService,
    JwtRefreshTokenStrategy,
    {
      provide: 'REFRESH_JWT_SERVICE', // Benutzerdefinierte Token-Bezeichnung
      useFactory: (configService: ConfigService) => {
        // Erstelle eine neue Instanz des JwtService mit der entsprechenden Konfiguration
        return new JwtService({
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '30m' },
        });
      },
      inject: [ConfigService], // Die notwendigen Abhängigkeiten für den benutzerdefinierten Provider
    },
  ],
  exports: [RefreshTokenService, 'REFRESH_JWT_SERVICE'], // Exportiere den benutzerdefinierten Provider
  controllers: [RefreshTokenController],
})
export class RefreshTokenModule {}
