import { BadRequestException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class InvalidCredentialsException extends BadRequestException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.invalid_credentials', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
