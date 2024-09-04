import { NotFoundException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class UserBusinessPointCardNotFoundException extends NotFoundException {
  constructor(userId: string, businessCardId: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.user_business_point_card_not_found', {
        args: { userId, businessCardId },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
