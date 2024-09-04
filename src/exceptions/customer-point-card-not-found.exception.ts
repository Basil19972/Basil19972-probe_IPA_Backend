import { NotFoundException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class CustomerPointCardNotFoundException extends NotFoundException {
  constructor(customerPointCardId: string, i18n: I18nService) {
    super(
      i18n.translate('events.exceptions.customer_point_card_not_found', {
        args: { customerPointCardId },
        lang: I18nContext.current().lang,
      }),
    );
  }
}
