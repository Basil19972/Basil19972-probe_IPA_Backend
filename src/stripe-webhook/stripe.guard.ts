import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StripeInvalideTokenException } from '../exceptions/stripe-invalide-token.exception';
import Stripe from 'stripe';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class StripeWebhookGuard implements CanActivate {
  private stripeClient: Stripe;

  constructor(private readonly i18n: I18nService) {
    this.stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];

    try {
      // Stellen Sie sicher, dass request.rawBody existiert und ein Buffer ist
      if (!request.rawBody || !(request.rawBody instanceof Buffer)) {
        throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
      }

      this.stripeClient.webhooks.constructEvent(
        request.rawBody.toString(), // Konvertieren Sie den Buffer in einen String
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );

      return true;
    } catch (err) {
      throw new StripeInvalideTokenException(this.i18n, err.message);
    }
  }
}
