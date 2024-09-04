import { BadRequestException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class OfferStartDateIsInPastException extends BadRequestException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.offer_start_date_in_past', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
