import { UnauthorizedException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class QrTokenNotAuthorizedToCreateException extends UnauthorizedException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.qr_token_not_authorized_to_create', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
