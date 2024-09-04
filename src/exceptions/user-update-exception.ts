import { InternalServerErrorException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class UserUpdateException extends InternalServerErrorException {
  constructor(errorDetail: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.user_update_error', {
        args: { errorDetail },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
