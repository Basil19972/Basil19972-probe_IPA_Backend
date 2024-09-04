import { BadRequestException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';
//wird aktuell nicht verwendet
export class EmailsNotFoundException extends BadRequestException {
  constructor(notFoundEmails: string[], i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.emails_not_found', {
        args: { notFoundEmails: notFoundEmails.join(', ') },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
