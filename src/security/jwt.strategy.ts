import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppUser } from '../appUser/appUser.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private static extractJWT(req: Request) {
    const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (fromHeader) return fromHeader;

    const fromCookie = req.cookies?.accessToken;
    if (fromCookie) return fromCookie;
    return null;
  }
  constructor(
    @Inject('AUTH_JWT_SERVICE')
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel('AppUser') private readonly userModel: Model<AppUser>,
  ) {
    super({
      // ignore Tokens without expiration date
      ignoreExpiration: false,
      // define how to extract the JWT from the request
      jwtFromRequest: JwtStrategy.extractJWT,
      // the token secret from .env file
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // here we just return the Payload beacus the actual validation is done by Passport on top of this
  async validate(payload: any): Promise<any> {
    return await this.userModel.findOne({ _id: payload.sub });
  }
}
