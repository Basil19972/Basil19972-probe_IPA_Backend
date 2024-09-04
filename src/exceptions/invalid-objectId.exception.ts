import { BadRequestException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class InvalidObjectIdException extends BadRequestException {
  constructor(id: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.invalid_object_id', {
        args: { id },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
