import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from './ability.factory';
import { CHECK_ABILITY, RequiredRule } from './abilities.decorator';

@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // JWT Überprüfung
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // JWT nicht vorhanden oder ungültig
    }

    // CASL Überprüfung
    const requirements: RequiredRule[] = this.reflector.getAllAndOverride<
      RequiredRule[]
    >(CHECK_ABILITY, [context.getHandler(), context.getClass()]);

    if (!requirements) {
      return true; // kein CheckAbilities Dekorator vorhanden, somit erlaubt
    }

    const ability = this.abilityFactory.defineAbility(user);

    return requirements.every((req) => ability.can(req.action, req.subject));
  }
}
