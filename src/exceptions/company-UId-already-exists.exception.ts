import { BadRequestException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class CompanyUIdAlreadyExistsException extends BadRequestException {
  constructor(uId: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.company_uid_already_exists', {
        args: { uId },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
