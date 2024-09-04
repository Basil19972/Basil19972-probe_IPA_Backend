import { UnauthorizedException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class RefreshTokenExpiredException extends UnauthorizedException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.refresh_token_expired', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
