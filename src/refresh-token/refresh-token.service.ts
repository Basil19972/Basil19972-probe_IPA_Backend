import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { AppUserService } from '../appUser/appUser.service';
import { InvalidTokenSignatureException } from '../exceptions/invalid-token-signature.exception';
import { RefreshTokenNotFoundException } from '../exceptions/refresh-token-not-found.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { RefreshToken } from './refreshToken.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    @Inject(forwardRef(() => AppUserService))
    private readonly appUserService: AppUserService,
    @Inject('REFRESH_JWT_SERVICE') // Injectieren Sie den JwtService speziell für Refresh Tokens
    private readonly jwtServiceRefreshToken: JwtService,
    @Inject('AUTH_JWT_SERVICE')
    private readonly jwtServiceAccessToken: JwtService,
    private readonly i18n: I18nService,
  ) {}

  // generate a new refresh token for a user

  async createRefreshToken(
    userId: Types.ObjectId,
    ttl: number = parseInt(process.env.REFRESH_TOKEN_EXPIRATION_IN_SECONDS),
  ): Promise<string> {
    const token = this.jwtServiceRefreshToken.sign(
      {
        id: userId,
      },
      {
        expiresIn: `${ttl}s`,
      },
    );

    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + ttl);
    /*
    const hashedToken = await bcrypt.hash(token, 10);
*/
    const refreshToken = new this.refreshTokenModel({
      token: token,
      expiryDate: expires,
      user: userId,
    });

    await refreshToken.save();
    return token;
  }

  async generateAccessToken(
    userIdFromPayload: string,
    currentRefreshToken: string,
  ) {
    // search token in db with userId
    const userId = new Types.ObjectId(userIdFromPayload);
    const refreshTokens = await this.refreshTokenModel.find({ user: userId });

    //throw exception if no token found
    if (!refreshTokens || refreshTokens.length === 0) {
      throw new RefreshTokenNotFoundException(this.i18n);
    }

    let isRefreshTokenValid = false;
    let matchedToken;
    for (const refreshToken of refreshTokens) {
      if (currentRefreshToken === refreshToken.token) {
        isRefreshTokenValid = true;
        matchedToken = refreshToken;
        break;
      }
    }

    // throw exception if token is not valid
    if (!isRefreshTokenValid) {
      throw new InvalidTokenSignatureException(this.i18n);
    }

    const user = await this.appUserService.findById(userIdFromPayload);

    if (matchedToken) {
      this.deleteRefreshTokenByUserId(matchedToken._id.toString());
    }

    if (!user) {
      throw new UserNotFoundException(userIdFromPayload, this.i18n);
    } else {
      const payload = { sub: userId, role: user.roles };

      return {
        accessToken: await this.jwtServiceAccessToken.sign(payload),
        refreshToken: currentRefreshToken,
      };
    }
  }

  async deleteRefreshTokenByUserId(tokenIdString: string): Promise<void> {
    const tokenId = new Types.ObjectId(tokenIdString);

    await this.refreshTokenModel.deleteMany({ user: tokenId });
  }

  async deleteRefreshTokenByToken(refreshToken: string) {
    await this.refreshTokenModel.deleteOne({ token: refreshToken });
  }

  async findTokenById(tokenId: string): Promise<RefreshToken> {
    return await this.refreshTokenModel.findById(tokenId);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteRefreshTokenIfExpired(): Promise<void> {
    const now = new Date();
    await this.refreshTokenModel.deleteMany({ expiryDate: { $lt: now } });
  }
}
