import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { ContactDTO } from './dto/contact.dto';
import { FeedbackDTO } from './dto/feedback.dto';

@Injectable()
export class ContactService {
  constructor(private mailService: MailService) {}

  async contact({ name, subject, email, message }: ContactDTO) {
    const finalSubject = `Contact: ${subject}`;
    const replyTo = `${name} <${email}>`;
    await this.mailService.sendContactEmail(replyTo, finalSubject, message);
  }

  async feedback({ type, message }: FeedbackDTO, { email, name }: any) {
    const subject = `Feedback (${type})`;
    const replyTo = `${name} <${email}>`;
    await this.mailService.sendContactEmail(replyTo, subject, message);
  }
}
