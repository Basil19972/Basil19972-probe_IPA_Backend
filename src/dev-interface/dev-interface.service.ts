import { Injectable } from '@nestjs/common';
import { AppUserService } from '../appUser/appUser.service';

@Injectable()
export class DevInterfaceService {
  constructor(readonly appUserService: AppUserService) {}

  async getAllUsers(role: string) {
    return this.appUserService.getAllUsersWithRoleDevInterface(role);
  }
}
