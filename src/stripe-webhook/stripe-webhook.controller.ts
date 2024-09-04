import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  HttpException,
  RawBodyRequest,
  Get,
  Query,
  Request,
} from '@nestjs/common';
import { StripeWebhookGuard } from './stripe.guard';
import { StripeWebhookService } from './stripe-webhook.service';
import { AppUser, StripeCustomer } from '../appUser/appUser.schema';
import { JwtAuthGuard } from '../security/jwt.guard';
import { AbilitiesGuard } from '../security/abilities.guard';
import { CheckAbilities } from '../security/abilities.decorator';
import { Actions } from '../security/ability.factory';
import { CustomerPortalUrl } from './DTO/customerPortalUrlDTO';

@Controller('stripe-webhook')
export class StripeWebhookController {
  constructor(private stripeWebhookService: StripeWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(StripeWebhookGuard)
  async webhook(@Req() req: RawBodyRequest<Request>) {
    // Stellen Sie sicher, dass request.rawBody ein Buffer ist
    if (!req.rawBody || !(req.rawBody instanceof Buffer)) {
      throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
    }

    // Parsen des rohen Body, um das Stripe Event-Objekt zu erhalten
    const event = JSON.parse(req.rawBody.toString());

    console.log('Received event:', event);

    // Behandeln unterschiedlicher Event-Typen
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        console.log('invoice.payment_succeeded');
        const appUserId = event.data.object.client_reference_id;
        const stripeCustomerId = event.data.object.customer;
        const stripeSubscriptionId = event.data.object.subscription;

        console.log(
          'appUserId',
          appUserId,
          'stripeSubscriptionId',
          stripeSubscriptionId,
          'stripeCustomerId',
          stripeCustomerId,
        );

        //creat object with data from stripe and save them to user By appUserId

        /*
        const stripeCustomer: StripeCustomer = {
          stripeCustomerId: event.data.object.customer,
          customerName: event.data.object.customer_details.name,
        };

        await this.stripeWebhookService.addRoleToAppUser(
          stripeCustomer,
          appUserId,
          stripeSubscriptionId,
        );
        */

        break;
      }

      case 'customer.subscription.updated': {
        console.log('customer.subscription.updated');

        const updatedProductId = event.data.object.plan.product;
        const stripeCustomerId = event.data.object.customer;

        await this.stripeWebhookService.handleUpdateAppUserSubscription(
          stripeCustomerId,
          updatedProductId,
        );

        break;
      }

      case 'customer.subscription.deleted': {
        console.log('customer.subscription.deleted');
        const stripeCustomerId = event.data.object.customer;

        await this.stripeWebhookService.handleCancelSubscription(
          stripeCustomerId,
        );

        break;
      }

      // Fügen Sie hier weitere Cases für andere Event-Typen hinzu

      default: {
        console.log(
          `Unbehandelter Event-Typ: ${event.type}` + event.data.object,
        );
      }
    }

    return {}; // Senden Sie eine leere Antwort zurück
  }

  @Get('customerPortal')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: Actions.READ, subject: AppUser })
  async getCustomerPortalUrlByCustomerId(
    @Query('stripeUserId') stripeUserId: string,
    @Request() req,
  ): Promise<CustomerPortalUrl> {
    const url = await this.stripeWebhookService.createCustomerPortalSession(
      stripeUserId,
      req.user.id,
    );

    const customerPortalUrl = new CustomerPortalUrl();
    customerPortalUrl.url = url;
    return customerPortalUrl;
  }
}
