import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DevInterfaceService } from './dev-interface.service';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '../security/jwt.guard';
import { AbilitiesGuard } from '../security/abilities.guard';
import { CheckAbilities } from '../security/abilities.decorator';
import { Actions } from '../security/ability.factory';

@Controller('devInterface')
export class DevInterfaceControllerController {
  constructor(
    private readonly i18n: I18nService,
    private readonly devInterfaceService: DevInterfaceService,
  ) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: 'devInterface' })
  async getAllUsers(
    @Query('role') role: string, // Nimmt den Query-Parameter 'role' an
  ) {
    return await this.devInterfaceService.getAllUsers(role);
  }
}
