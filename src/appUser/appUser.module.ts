import { Module, forwardRef } from '@nestjs/common';
import { AppUserService } from './appUser.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthSchema } from './appUser.schema';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../security/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AbilityFactory } from '../security/ability.factory';
import { AppUserController } from './appUser.controller';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';
import { CompanyModule } from '../company/company.module';
import { MailModule } from '../mail/mail.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'AppUser', schema: AuthSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    CompanyModule,
    MailModule,
    HttpModule, // Stellen Sie sicher, dass dies hinzugefügt wird

    forwardRef(() => RefreshTokenModule),
  ],
  providers: [
    AppUserService,
    JwtStrategy,
    AbilityFactory,
    {
      provide: 'AUTH_JWT_SERVICE',
      useFactory: (configService: ConfigService) => {
        const accessTokenExpiration = configService.get<string>(
          'ACCESS_TOKEN_EXPIRATION',
        );

        return new JwtService({
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: accessTokenExpiration },
        });
      },

      inject: [ConfigService],
    },
    {
      provide: 'MAIL_JWT_SERVICE',
      useFactory: (configService: ConfigService) => {
        return new JwtService({
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '24h' },
        });
      },
      inject: [ConfigService],
    },
  ],
  controllers: [AppUserController],
  exports: [
    MongooseModule.forFeature([{ name: 'AppUser', schema: AuthSchema }]),
    AbilityFactory,
    'AUTH_JWT_SERVICE',
    AppUserService,
  ],
})
export class AppUserModule {}
