import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  providers: [ContactService],
  controllers: [ContactController],
  imports: [MailModule],
})
export class ContactModule {}
