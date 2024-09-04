import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { RefreshTokenService } from './refresh-token.service';
import { InvalidTokenDataException } from '../exceptions/invalid-token-data-exception';
import { RefreshTokenExpiredException } from '../exceptions/refresh-token-expired.exception';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  private static extractJWT(req: Request) {
    const fromBody = req.body?.refreshToken;
    if (fromBody) return fromBody;

    const fromCookie = req.cookies?.refreshToken;
    if (fromCookie) return fromCookie;
    return null;
  }
  constructor(
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly i18n: I18nService,
  ) {
    super({
      ignoreExpiration: true,
      jwtFromRequest: JwtRefreshTokenStrategy.extractJWT,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<any> {
    if (!payload) {
      throw new InvalidTokenDataException(this.i18n);
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      // Hier löschen Sie den Token aus der Datenbank
      await this.refreshTokenService
        .deleteRefreshTokenByUserId(payload.id)
        .then(() => {
          throw new RefreshTokenExpiredException(this.i18n);
        });
    }

    return payload;
  }
}
