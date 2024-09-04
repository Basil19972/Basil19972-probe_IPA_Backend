import { NotFoundException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class UserDoNotHaveStripeCustomer extends NotFoundException {
  constructor(userId: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.user_does_not_have_stripe_customer', {
        args: { userId },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
