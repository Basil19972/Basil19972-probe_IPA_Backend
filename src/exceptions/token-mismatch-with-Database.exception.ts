import { UnauthorizedException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class TokenMismatchWithDatabaseException extends UnauthorizedException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.token_mismatch_with_database', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
