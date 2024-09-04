import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { clearTestDB } from '../../test/database.utils';
import * as request from 'supertest';
import { loginUser, registerOwner, registerUser } from '../../test/user.utils';
import { createBusinessPointCard } from '../../test/pointCard.utils';
import { createCustomerPointCard } from '../../test/customerPointCard.utils';
import { generateQRCode } from '../../test/qrCode.utils';

describe('UserDataCleanupController (e2e)', () => {
  let app: INestApplication;
  let userJwtToken: string;
  let ownerJwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        disableErrorMessages: false,
      }),
    );
    await app.init();

    //actvate testmode
    process.env.TESTMODE = 'true';

    await registerUser(app);
    await registerOwner(app);

    const userTokens = await loginUser(app, 'test@example.com', 'Test1234!');
    const ownerTokens = await loginUser(
      app,
      'basil.owner@example.com',
      'Test1234!',
    );

    userJwtToken = userTokens.accessToken;
    ownerJwtToken = ownerTokens.accessToken;

    // Erstellen einer BusinessPointCard
    const businessPointCardResponse = await createBusinessPointCard(
      app,
      ownerJwtToken,
      {
        name: 'MyCard',
        maxpoints: 10,
        discount: 25,
        description: 'Jeder 10te Burger ist gratis',
      },
    );

    // Erstellen einer CustomerPointCard
    await createCustomerPointCard(
      app,
      userJwtToken,
      businessPointCardResponse._id,
    );

    // Generieren eines QR-Codes
    await generateQRCode(app, ownerJwtToken, businessPointCardResponse._id);
  });

  it('/userDataCleanup (DELETE) - should delete user data successfully with user token', async () => {
    await request(app.getHttpServer())
      .delete('/userDataCleanup')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.OK);
  });

  it('/userDataCleanup (DELETE) - should fail without a token', async () => {
    await request(app.getHttpServer())
      .delete('/userDataCleanup')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/userDataCleanup (DELETE) - should fail with an invalid token', async () => {
    await request(app.getHttpServer())
      .delete('/userDataCleanup')
      .set('Authorization', 'Bearer invalid_token')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/userDataCleanup (DELETE) - should delete owner data successfully with owner token', async () => {
    await request(app.getHttpServer())
      .delete('/userDataCleanup')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);
  });

  it('/userDataCleanup (DELETE) - should fail without a token', async () => {
    await request(app.getHttpServer())
      .delete('/userDataCleanup')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/userDataCleanup (DELETE) - should fail with an invalid token', async () => {
    await request(app.getHttpServer())
      .delete('/userDataCleanup')
      .set('Authorization', 'Bearer invalid_token')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  afterAll(async () => {
    await clearTestDB();
    //deactivate testmode
    process.env.TESTMODE = 'false';

    await app.close();
  });
});
