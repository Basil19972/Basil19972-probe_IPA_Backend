import { Injectable } from '@nestjs/common';
import { AppUserService } from '../appUser/appUser.service';
import { UserRole } from '../appUser/role.enum';
import { Product } from './productId.enum';
import { StripeCustomer } from '../appUser/appUser.schema';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import Stripe from 'stripe';
import { UserDoNotHaveStripeCustomer } from '../exceptions/user-do-not-have-stripe-customer.exception';
import { StripeCustomerIdMismatchUser } from '../exceptions/stripeCustomerId-missmatch-user.exception';
import { StripeUpdateUserException } from '../exceptions/stripe.update.exception';
import { StripeGetSubscriptionException } from '../exceptions/stripe-get-subscription.exception';
import { CustomerPortalSessionCreationException } from '../exceptions/stripe-customer-portal.exception';
import { StripeUserDeleteException } from '../exceptions/stripe-customer-delete.exception';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;

  constructor(
    private readonly appUserService: AppUserService,
    private readonly httpService: HttpService,
    private readonly i18n: I18nService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  async addRoleToAppUserByAppUserId(appUserId: string, productId: string) {
    switch (productId) {
      case Product.Platinum:
        this.appUserService.updateAppUserRoleByUserId(
          appUserId,
          UserRole.PlatinumOwner,
        );
        break;
      case Product.Gold:
        this.appUserService.updateAppUserRoleByUserId(
          appUserId,
          UserRole.GoldOwner,
        );
        break;
      case Product.Silver:
        this.appUserService.updateAppUserRoleByUserId(
          appUserId,
          UserRole.SilverOwner,
        );
        break;
      default:
        break;
    }
  }

  async addRoleToAppUser(
    stripeCustomer: StripeCustomer,
    appUserId: string,
    stripeSubscriptionId: string,
  ) {
    const user = await this.appUserService.findById(appUserId);

    if (!user) {
      throw new UserNotFoundException(appUserId, this.i18n);
    }
    //update stripe customer via stripe api
    await this.updateStripeUser(
      stripeCustomer.stripeCustomerId,
      user.email,
      appUserId,
    );

    //add stripe customer to user

    await this.appUserService.addStripeCustomerToUser(
      stripeCustomer,
      appUserId,
    );

    // get Product or price id from Subscriptionid
    const subscription =
      await this.getStripeSubscriptionById(stripeSubscriptionId);

    // update User Role
    await this.addRoleToAppUserByAppUserId(
      appUserId,
      subscription.plan.product,
    );
  }

  async updateStripeUser(
    customerId: string,
    newUserEmail: string,
    appUserId: string,
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    };

    const body = new URLSearchParams({
      email: newUserEmail,
      'metadata[AppUserId]': appUserId,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://api.stripe.com/v1/customers/${customerId}`,
          body.toString(),
          {
            headers,
          },
        ),
      );

      return response.data; // Zugriff auf die 'data' Eigenschaft
    } catch (error) {
      throw new StripeUpdateUserException(error.message, this.i18n);
    }
  }

  async getStripeSubscriptionById(subscriptionId: string): Promise<any> {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
          {
            headers,
          },
        ),
      );

      return response.data; // Gibt die 'data' Eigenschaft zurück
    } catch (error) {
      throw new StripeGetSubscriptionException(error.message, this.i18n);
    }
  }

  //diese  methode ist etwas speziell da diese bei jedem update event auferuft wird auch vor dem erstellten user
  // würde das hier immer exceptios werfen, ich habe ein workaround gemacht mit einer if (user) abfrage
  async handleUpdateAppUserSubscription(
    stripeCustomerId: string,
    productId: string,
  ) {
    const user =
      await this.appUserService.getUserByStripeCustomerId(stripeCustomerId);

    if (user) {
      await this.addRoleToAppUserByAppUserId(user._id, productId);
    }
  }

  async createCustomerPortalSession(
    customerId: string,
    appUserId: string,
  ): Promise<string> {
    //check if appUser has stripe customer id is the same as the customer id from the event
    const user = await this.appUserService.findById(appUserId);

    if (!user) {
      throw new UserNotFoundException(appUserId, this.i18n);
    }

    if (!user.stripeCustomer) {
      throw new UserDoNotHaveStripeCustomer(user._id, this.i18n);
    }

    if (user.stripeCustomer[0].stripeCustomerId !== customerId) {
      throw new StripeCustomerIdMismatchUser(this.i18n);
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: 'http://localhost:3001/',
      });

      return session.url; // Gibt den URL der Sitzung zurück
    } catch (error) {
      throw new CustomerPortalSessionCreationException(
        error.message,
        this.i18n,
      );
    }
  }

  async handleCancelSubscription(stripeCustomerId: string) {
    const user =
      await this.appUserService.getUserByStripeCustomerId(stripeCustomerId);

    await this.appUserService.updateAppUserRoleByUserId(
      user._id,
      UserRole.Owner,
    );

    await this.appUserService.deleteStripeCustomerFromUser(user._id);
    await this.deleteStripeCustomerByCustomerId(stripeCustomerId);
  }

  async deleteStripeCustomerByCustomerId(customerId: string) {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.delete(
          `https://api.stripe.com/v1/customers/${customerId}`,
          {
            headers,
          },
        ),
      );

      return response.data; // Zugriff auf die 'data' Eigenschaft
    } catch (error) {
      throw new StripeUserDeleteException(error.message, this.i18n);
    }
  }
}
