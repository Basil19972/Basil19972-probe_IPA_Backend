import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';

const WHITELISTED_TRACKER = 'whitelisted-ip';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Extrahieren der IP-Adresse aus dem Header
    const ipAddress = req.headers['x-forwarded-for'] || req.ip;

    // IP-Adresse loggen
    this.logger.log(`Incoming request from IP: ${ipAddress}`);

    // IP-Adresse freigeben (z.B. wenn es sich um den Server handelt)
    const whitelistedIp = process.env.WHITELISTED_IP;

    if (ipAddress === whitelistedIp) {
      // Rückgabe einer eindeutigen Kennung, die nicht limitiert wird
      return WHITELISTED_TRACKER;
    }

    // Rückgabe der tatsächlichen IP-Adresse zur Verfolgung der Rate Limits
    return ipAddress;
  }

  protected getRequestResponse(context: ExecutionContext): {
    req: any;
    res: any;
  } {
    const ctx = context.switchToHttp();
    return { req: ctx.getRequest(), res: ctx.getResponse() };
  }
}
