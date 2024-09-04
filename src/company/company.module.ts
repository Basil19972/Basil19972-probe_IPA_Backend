import { Module, forwardRef } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CompanySchema } from './compnay.schema';
import { MailModule } from '../mail/mail.module';
import { AppUserModule } from '../appUser/appUser.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    forwardRef(() => AppUserModule),
    MongooseModule.forFeature([{ name: 'Company', schema: CompanySchema }]),
    MailModule,
    HttpModule,
    ConfigModule,
  ],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
