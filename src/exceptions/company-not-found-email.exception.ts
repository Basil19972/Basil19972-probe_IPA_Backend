import { NotFoundException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class CompanyNotFoundEmailException extends NotFoundException {
  constructor(id: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.company_not_found_email', {
        args: { id },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
