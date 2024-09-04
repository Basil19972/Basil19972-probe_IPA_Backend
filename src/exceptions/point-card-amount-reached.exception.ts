import { InternalServerErrorException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class PointCardAmountReachedException extends InternalServerErrorException {
  constructor(i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.point_card_amount_reached', {
        lang: I18nContext.current().lang,
      }),
    );
  }
}
