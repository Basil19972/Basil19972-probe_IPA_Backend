import { UnauthorizedException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class UserNotOwnerOfCompanyException extends UnauthorizedException {
  constructor(userId: string, companyId: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.user_not_owner_of_company', {
        args: { userId, companyId },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
