import { BadRequestException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class CompanyLogoInvalidSvgException extends BadRequestException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.company_logo_invalid_svg', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
