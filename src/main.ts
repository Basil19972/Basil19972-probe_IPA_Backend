import tracer from './tracer';

import { Logger, ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  await tracer.start();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.use(cookieParser());

  const corsOptions: CorsOptions = {
    origin: 'http://localhost:3001', // This should match the origin of your frontend app
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  };

  app.enableCors(corsOptions);

  app.useGlobalPipes(
    new ValidationPipe({
      // Automatische Transformation von Eingabedaten in die Typen der DTOs
      transform: true,
      // Strengere Validierung: Nicht im DTO definierte Eigenschaften werden entfernt
      whitelist: true,
      // Wenn Eigenschaften im Request sind, die nicht im DTO definiert sind, wird ein Fehler geworfen
      forbidNonWhitelisted: true,
      // Detaillierte Fehlermeldungen bei Validierungsfehlern
      disableErrorMessages: false,
    }),
  );

  app.setGlobalPrefix(process.env.API_PREFIX || '/');

  // Swagger API Documentation
  if (process.env.NODE_ENV === 'development') {
    const options = new DocumentBuilder()
      .setTitle('Stämpu REST API')
      .setVersion(process.env.npm_package_version)
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);
  }

  const logger = new Logger('UnhandledAsyncError');
  process.on('unhandledRejection', (e) => logger.error(e));

  await app.listen(3000);
}
bootstrap();
