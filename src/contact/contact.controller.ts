import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '../appUser/appUser.decorator';
import { ContactService } from './contact.service';
import { ContactDTO } from './dto/contact.dto';
import { FeedbackDTO } from './dto/feedback.dto';
import { JwtAuthGuard } from '../security/jwt.guard';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async contact(@Body() data: ContactDTO) {
    await this.contactService.contact(data);
  }

  @Post('feedback')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  feedback(@Body() data: FeedbackDTO, @User() user: any) {
    return this.contactService.feedback(data, user);
  }
}
