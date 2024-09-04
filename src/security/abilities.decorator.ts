import { SetMetadata } from '@nestjs/common';
import { Actions, Subjects } from './ability.factory';

export const CHECK_ABILITY = 'check_ability';

export interface RequiredRule {
  action: Actions;
  subject: Subjects;
}

export const CheckAbilities = (...requirements: RequiredRule[]) =>
  SetMetadata(CHECK_ABILITY, requirements);
