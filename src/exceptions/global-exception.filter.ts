import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Verwenden Sie die spezifische Nachricht aus der Exception, falls vorhanden
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exceptionResponse['message'] || this.getGenericMessage(status);
    } else if (exception instanceof Error) {
      // Für nicht-HttpExceptions, verwenden Sie die tatsächliche Fehlermeldung
      message = exception.message;
    }

    this.logger.error(
      `Status: ${status}, Message: ${message}, Path: ${request.url}`,
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getGenericMessage(statusCode: number): Promise<string> {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return this.i18n.translate('events.generic.bad_request', {
          lang: I18nContext.current().lang,
        });
      case HttpStatus.UNAUTHORIZED:
        return this.i18n.translate('events.generic.unauthorized', {
          lang: I18nContext.current().lang,
        });
      case HttpStatus.FORBIDDEN:
        return this.i18n.translate('events.generic.forbidden', {
          lang: I18nContext.current().lang,
        });
      case HttpStatus.NOT_FOUND:
        return this.i18n.translate('events.generic.not_found', {
          lang: I18nContext.current().lang,
        });
      default:
        return this.i18n.translate('events.generic.general_error', {
          lang: I18nContext.current().lang,
        });
    }
  }
}
