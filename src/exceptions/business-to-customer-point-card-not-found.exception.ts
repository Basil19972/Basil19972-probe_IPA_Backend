import { NotFoundException } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export class BusinessToCustomerPointCardNotFoundException extends NotFoundException {
  constructor(businessCardId: string, i18n: I18nService) {
    super(
      i18n.translate(
        'events.exceptions.business_to_customer_point_card_not_found',
        {
          args: { businessCardId },
          lang: I18nContext.current().lang,
        },
      ),
    );
  }
}
