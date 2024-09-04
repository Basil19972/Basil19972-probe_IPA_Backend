import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'mail.infomaniak.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const mailOptions: MailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to,
      subject,
      text,
      html,
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException();
    }
  }

  async sendContactEmail(replyTo: string, subject: string, text: string) {
    const to = this.configService.get('OFFICIAL_MAIL');
    const mailOptions: MailOptions = {
      from: this.configService.get('EMAIL_USER'),
      replyTo,
      to,
      subject: subject,
      text: text,
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException();
    }
  }
}
