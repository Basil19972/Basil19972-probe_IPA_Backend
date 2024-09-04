import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { clearTestDB } from '../../test/database.utils';
import * as request from 'supertest';

describe('StripeWebhookController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();

    //actvate testmode
    process.env.TESTMODE = 'true';
  });

  it('/stripe-webhook (POST) should reject unauthorized requests (language header default(en))', async () => {
    const response = await request(app.getHttpServer())
      .post('/stripe-webhook')
      .send({ dummy: 'data' })
      .expect(HttpStatus.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message', 'Invalid Stripe token.');
  });

  it('/stripe-webhook (POST) should reject unauthorized requests (language header de)', async () => {
    const response = await request(app.getHttpServer())
      .post('/stripe-webhook')
      .send({ dummy: 'data' })
      .set('x-custom-lang', 'de')
      .expect(HttpStatus.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message', 'Ungültiger Stripe-Token.');
  });

  it('/stripe-webhook (POST) should reject unauthorized requests (language header en)', async () => {
    const response = await request(app.getHttpServer())
      .post('/stripe-webhook')
      .send({ dummy: 'data' })
      .set('x-custom-lang', 'en')
      .expect(HttpStatus.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message', 'Invalid Stripe token.');
  });

  it('/stripe-webhook (POST) should reject unauthorized requests (language header it)', async () => {
    const response = await request(app.getHttpServer())
      .post('/stripe-webhook')
      .send({ dummy: 'data' })
      .set('x-custom-lang', 'it')
      .expect(HttpStatus.UNAUTHORIZED);
    expect(response.body).toHaveProperty('message', 'Token Stripe non valido.');
  });

  it('/stripe-webhook (POST) should reject unauthorized requests (language header fr)', async () => {
    const response = await request(app.getHttpServer())
      .post('/stripe-webhook')
      .send({ dummy: 'data' })
      .set('x-custom-lang', 'fr')
      .expect(HttpStatus.UNAUTHORIZED);
    expect(response.body).toHaveProperty(
      'message',
      'Le jeton Stripe est invalide.',
    );
  });

  it('/stripe-webhook/customerPortal (GET) - should fail without token', async () => {
    const response = await request(app.getHttpServer())
      .get('/stripe-webhook/customerPortal')
      .query({ stripeUserId: 'cus_PF8Pet4RzX2uub' })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body).toHaveProperty('statusCode', 401);
    expect(response.body).toHaveProperty('message', 'Unauthorized');
    expect(response.body).toHaveProperty(
      'path',
      '/stripe-webhook/customerPortal?stripeUserId=cus_PF8Pet4RzX2uub',
    );
  });

  afterAll(async () => {
    await clearTestDB();

    //deactivate testmode
    process.env.TESTMODE = 'false';
    await app.close();
  });
});
