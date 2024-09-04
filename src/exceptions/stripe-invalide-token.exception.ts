import { UnauthorizedException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class StripeInvalideTokenException extends UnauthorizedException {
  constructor(i18n: I18nService, error: string) {
    super(
      i18n.translate('events.exceptions.invalid_stripe_token', {
        args: { error },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
