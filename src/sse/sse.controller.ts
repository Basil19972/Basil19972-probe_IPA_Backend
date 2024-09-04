import { Controller, Request, Res, Sse, UseGuards } from '@nestjs/common';
import { MessageEvent, SseService } from './sse.service';
import { CheckAbilities } from '../security/abilities.decorator';
import { JwtAuthGuard } from '../security/jwt.guard';
import { AbilitiesGuard } from '../security/abilities.guard';
import { Actions } from '../security/ability.factory';
import { Observable } from 'rxjs';
import { Response } from 'express';

@Controller('sse')
export class SseController {
  constructor(private sseService: SseService) {}

  @Sse('events')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.CREATE, subject: 'sse' })
  registerSee(@Request() req, @Res() res: Response): Observable<MessageEvent> {
    res.on('close', () => {
      this.sseService.deleteUserIdFromMap(req.user.id);
    });

    return this.sseService.registerUserSse(req.user.id);
  }
}
