import { InternalServerErrorException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class TokenNotFoundInDatabaseException extends InternalServerErrorException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.token_not_found_in_database', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
