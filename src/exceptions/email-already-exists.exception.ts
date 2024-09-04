import { BadRequestException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class EmailAlreadyExistsException extends BadRequestException {
  constructor(email: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.email_already_exists', {
        args: { email },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
