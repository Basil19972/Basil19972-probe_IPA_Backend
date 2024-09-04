import { BadRequestException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class EmployeeAlreadyExistsException extends BadRequestException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.employee_already_exists', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
