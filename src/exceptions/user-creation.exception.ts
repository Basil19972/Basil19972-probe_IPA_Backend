import { InternalServerErrorException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class UserCreationException extends InternalServerErrorException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.user_creation_error', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
