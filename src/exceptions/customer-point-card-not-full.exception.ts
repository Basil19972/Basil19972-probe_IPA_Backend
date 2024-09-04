import { InternalServerErrorException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class CustomerPointCardNotFullException extends InternalServerErrorException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.customer_point_card_not_full', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
