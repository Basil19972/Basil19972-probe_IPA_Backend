import { InternalServerErrorException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class StripeUserDeleteException extends InternalServerErrorException {
  constructor(error: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.stripe_user_delete_error', {
        args: { error },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
