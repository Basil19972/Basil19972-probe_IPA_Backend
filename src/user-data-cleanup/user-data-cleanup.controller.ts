import { Controller, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CheckAbilities } from '../security/abilities.decorator';
import { AbilitiesGuard } from '../security/abilities.guard';
import { Actions } from '../security/ability.factory';
import { JwtAuthGuard } from '../security/jwt.guard';
import { UserDataCleanupService } from './user-data-cleanup.service';
import { AppUser } from '../appUser/appUser.schema';

@Controller('userDataCleanup')
export class UserDataCleanupController {
  constructor(private userDataCleanUpService: UserDataCleanupService) {}

  @Delete()
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.DELETE, subject: AppUser })
  async cleanAllUserData(@Request() req) {
    await this.userDataCleanUpService.delete(req.user);
  }

  @Delete('employeeData')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.DELETE, subject: AppUser })
  async cleanAllEmployeeData(
    @Request() req,
    @Query('employeeId') employeeId: string,
  ) {
    await this.userDataCleanUpService.cleanAllEmployeeData(
      req.user,
      employeeId,
    );
  }
}
