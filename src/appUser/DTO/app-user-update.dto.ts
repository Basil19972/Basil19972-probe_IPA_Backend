import { PickType } from '@nestjs/swagger';
import { AppUserDTO } from './AppUserDTO';

export class AppUserUpdateDTO extends PickType(AppUserDTO, ['name']) {}
