import { InternalServerErrorException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class OfferLimitReachedException extends InternalServerErrorException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.offer_scan_limit_reached', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
