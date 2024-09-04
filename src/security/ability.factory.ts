import { Injectable } from '@nestjs/common';
import { AppUser } from '../appUser/appUser.schema';
import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
  createMongoAbility,
} from '@casl/ability';
import { UserRole } from '../appUser/role.enum';
import { BusinessPointCard } from '../point-card/point-Crad.schema';
import { CustomerPointCard } from '../customer-point-card/customer-point-card.schema';
import { QRCode } from '../qr-code/qr-code.schema';
import { Company } from '../company/compnay.schema';
import { Offer } from '../offer/offer.schema';

export enum Actions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export type Subjects = InferSubjects<
  | typeof AppUser
  | typeof BusinessPointCard
  | typeof CustomerPointCard
  | typeof Company
  | typeof QRCode
  | typeof Offer
  | 'devInterface'
  | 'analytics'
  | 'sse'
  | 'employees'
  | 'all'
>;
export type AppAbility = MongoAbility<[Actions, Subjects]>;

@Injectable()
export class AbilityFactory {
  defineAbility(appuser: AppUser) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    if (appuser.roles.some((role) => role === UserRole.Owner)) {
      can(Actions.CREATE, BusinessPointCard);
      can(Actions.READ, BusinessPointCard);
      can(Actions.UPDATE, BusinessPointCard);
      can(Actions.DELETE, BusinessPointCard);

      can(Actions.UPDATE, CustomerPointCard);

      can(Actions.READ, AppUser);
      can(Actions.DELETE, AppUser);
      can(Actions.UPDATE, AppUser);

      can(Actions.UPDATE, Company);
      can(Actions.READ, Company);

      can(Actions.DELETE, CustomerPointCard);
      can(Actions.UPDATE, AppUser);

      can(Actions.CREATE, QRCode);
      can(Actions.READ, QRCode);

      can(Actions.READ, Offer);

      can(Actions.CREATE, 'sse');

      can(Actions.READ, 'employees');
      can(Actions.CREATE, 'employees');
      can(Actions.UPDATE, 'employees');
      can(Actions.DELETE, 'employees');

      can(Actions.READ, 'analytics');
    } else if (appuser.roles.some((role) => role === UserRole.User)) {
      can(Actions.READ, BusinessPointCard);

      can(Actions.CREATE, CustomerPointCard);
      can(Actions.READ, CustomerPointCard);
      can(Actions.UPDATE, CustomerPointCard);

      can(Actions.READ, AppUser);
      can(Actions.UPDATE, AppUser);
      can(Actions.DELETE, AppUser);

      can(Actions.DELETE, CustomerPointCard);

      can(Actions.READ, Company);

      can(Actions.READ, QRCode);

      can(Actions.READ, Offer);

      can(Actions.CREATE, 'sse');
    } else if (appuser.roles.some((role) => role === UserRole.Employee)) {
      can(Actions.READ, BusinessPointCard);

      can(Actions.CREATE, CustomerPointCard);
      can(Actions.UPDATE, CustomerPointCard);
      can(Actions.DELETE, CustomerPointCard);

      can(Actions.READ, QRCode);
      can(Actions.CREATE, QRCode);

      can(Actions.DELETE, AppUser);
      can(Actions.READ, AppUser);
      can(Actions.UPDATE, AppUser);

      can(Actions.READ, Company);

      can(Actions.CREATE, QRCode);
      can(Actions.READ, QRCode);

      can(Actions.READ, Offer);

      can(Actions.CREATE, 'sse');
    } else if (appuser.roles.some((role) => role === UserRole.SilverOwner)) {
      can(Actions.CREATE, BusinessPointCard);
      can(Actions.READ, BusinessPointCard);
      can(Actions.UPDATE, BusinessPointCard);
      can(Actions.DELETE, BusinessPointCard);

      can(Actions.UPDATE, CustomerPointCard);

      can(Actions.READ, AppUser);
      can(Actions.DELETE, AppUser);
      can(Actions.UPDATE, AppUser);

      can(Actions.UPDATE, Company);
      can(Actions.READ, Company);

      can(Actions.DELETE, CustomerPointCard);
      can(Actions.UPDATE, AppUser);

      can(Actions.CREATE, QRCode);
      can(Actions.READ, QRCode);

      can(Actions.READ, Offer);

      can(Actions.CREATE, 'sse');

      can(Actions.READ, 'employees');
      can(Actions.CREATE, 'employees');
      can(Actions.UPDATE, 'employees');
      can(Actions.DELETE, 'employees');
    } else if (appuser.roles.some((role) => role === UserRole.GoldOwner)) {
      can(Actions.CREATE, BusinessPointCard);
      can(Actions.READ, BusinessPointCard);
      can(Actions.UPDATE, BusinessPointCard);
      can(Actions.DELETE, BusinessPointCard);

      can(Actions.UPDATE, CustomerPointCard);

      can(Actions.READ, AppUser);
      can(Actions.DELETE, AppUser);
      can(Actions.UPDATE, AppUser);

      can(Actions.UPDATE, Company);
      can(Actions.READ, Company);

      can(Actions.DELETE, CustomerPointCard);
      can(Actions.UPDATE, AppUser);

      can(Actions.CREATE, QRCode);
      can(Actions.READ, QRCode);

      can(Actions.READ, Offer);
      can(Actions.CREATE, Offer);

      can(Actions.CREATE, 'sse');

      can(Actions.READ, 'employees');
      can(Actions.CREATE, 'employees');
      can(Actions.UPDATE, 'employees');
      can(Actions.DELETE, 'employees');
    } else if (appuser.roles.some((role) => role === UserRole.PlatinumOwner)) {
      can(Actions.CREATE, BusinessPointCard);
      can(Actions.READ, BusinessPointCard);
      can(Actions.UPDATE, BusinessPointCard);
      can(Actions.DELETE, BusinessPointCard);

      can(Actions.UPDATE, CustomerPointCard);

      can(Actions.READ, AppUser);
      can(Actions.DELETE, AppUser);
      can(Actions.UPDATE, AppUser);

      can(Actions.UPDATE, Company);
      can(Actions.READ, Company);

      can(Actions.DELETE, CustomerPointCard);
      can(Actions.UPDATE, AppUser);

      can(Actions.CREATE, QRCode);
      can(Actions.READ, QRCode);

      can(Actions.READ, Offer);
      can(Actions.CREATE, Offer);

      can(Actions.READ, 'analytics');

      can(Actions.CREATE, 'sse');

      can(Actions.READ, 'employees');
      can(Actions.CREATE, 'employees');
      can(Actions.UPDATE, 'employees');
      can(Actions.DELETE, 'employees');
    } else if (appuser.roles.some((role) => role === UserRole.Dev)) {
      can(Actions.CREATE, BusinessPointCard);
      can(Actions.READ, BusinessPointCard);
      can(Actions.UPDATE, BusinessPointCard);
      can(Actions.DELETE, BusinessPointCard);

      can(Actions.UPDATE, CustomerPointCard);

      can(Actions.READ, AppUser);
      can(Actions.DELETE, AppUser);
      can(Actions.UPDATE, AppUser);

      can(Actions.UPDATE, Company);
      can(Actions.READ, Company);

      can(Actions.DELETE, CustomerPointCard);
      can(Actions.UPDATE, AppUser);

      can(Actions.CREATE, QRCode);
      can(Actions.READ, QRCode);

      can(Actions.READ, Offer);

      can(Actions.READ, 'devInterface');
      can(Actions.UPDATE, 'devInterface');

      can(Actions.CREATE, 'sse');

      can(Actions.READ, 'employees');
      can(Actions.CREATE, 'employees');
      can(Actions.UPDATE, 'employees');
      can(Actions.DELETE, 'employees');
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
