import { NotFoundException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class StripeCustomerIdMismatchUser extends NotFoundException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.stripe_customer_id_mismatch_user', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
