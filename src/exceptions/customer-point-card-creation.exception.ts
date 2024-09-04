import { InternalServerErrorException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class CustomerPointCardCreationException extends InternalServerErrorException {
  constructor(errorDetail: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.customer_point_card_creation_error', {
        args: { errorDetail },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
