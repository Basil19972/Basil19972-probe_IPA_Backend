import { forwardRef, Module } from '@nestjs/common';
import { PointCardController } from './point-card.controller';
import { PointCardService } from './point-card.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessPointCardSchema } from './point-Crad.schema';
import { JwtStrategy } from '../security/jwt.strategy';
import { AppUserModule } from '../appUser/appUser.module';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';
import { CustomerPointCardModule } from '../customer-point-card/customer-point-card.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'BusinessPointCard', schema: BusinessPointCardSchema },
    ]),
    forwardRef(() => CustomerPointCardModule),
    AppUserModule,
    RefreshTokenModule,
  ],
  controllers: [PointCardController],
  providers: [PointCardService, JwtStrategy],
  exports: [PointCardService],
})
export class PointCardModule {}
