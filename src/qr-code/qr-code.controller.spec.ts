import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { createCustomerPointCard } from '../../test/customerPointCard.utils';
import { clearTestDB } from '../../test/database.utils';
import { createBusinessPointCard } from '../../test/pointCard.utils';
import {
  getPrincipalUser,
  loginUser,
  registerEmployee,
  registerOwner,
  registerOwner2,
  registerUser,
} from '../../test/user.utils';
import { AppModule } from '../app.module';

describe('QrCodeController (e2e)', () => {
  let app: INestApplication;
  let userJwtToken: string;
  let ownerJwtToken: string;
  let owner2JwtToken: string;
  let employeeFromOwner2JwtToken: string;

  let chreatedBusinessPointCardId: string;
  let chreatedBusinessPointCardId2: string;

  let qrCodeToken: string;

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

    // Registrieren und Einloggen eines Benutzers
    await registerUser(app);
    await registerOwner(app);
    await registerOwner2(app);

    const ownerTokens = await loginUser(
      app,
      'basil.owner@example.com',
      'Test1234!',
    );

    const ownerTokens2 = await loginUser(
      app,
      'basil.owner2@example.com',
      'Test1234!',
    );

    const userTokens = await loginUser(app, 'test@example.com', 'Test1234!');

    ownerJwtToken = ownerTokens.accessToken;
    owner2JwtToken = ownerTokens2.accessToken;
    userJwtToken = userTokens.accessToken;

    const user = await getPrincipalUser(app, owner2JwtToken);

    await registerEmployee(app, user.company, owner2JwtToken);
    const employeeToken = await loginUser(
      app,
      'basil3.test@test.com',
      'Test1234!',
    );

    employeeFromOwner2JwtToken = employeeToken.accessToken;

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
    chreatedBusinessPointCardId = businessPointCardResponse._id;

    const businessPointCardResponse2 = await createBusinessPointCard(
      app,
      owner2JwtToken,
      {
        name: 'MyCard2',
        maxpoints: 9,
        discount: 50,
        description: 'Jeder 10te Burger ist gratis',
      },
    );
    chreatedBusinessPointCardId2 = businessPointCardResponse2._id;

    // Erstellen einer CustomerPointCard
    await createCustomerPointCard(
      app,
      userJwtToken,
      businessPointCardResponse._id,
    );
  });

  it('/qrcode/generate (POST) - should generate QR code successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/qrcode/generate')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({
        points: 2,
        businessPointCardID: chreatedBusinessPointCardId,
      })
      .expect(HttpStatus.CREATED);

    // Extrahieren des Tokens aus der JSON-Antwort
    const responseBody = JSON.parse(response.text);
    qrCodeToken = responseBody.token;

    expect(qrCodeToken).toBeDefined();
    expect(responseBody.token).toBeDefined();
  });

  it('/qrcode/generate (POST) - should generate QR code successfully as Employee', async () => {
    const response = await request(app.getHttpServer())
      .post('/qrcode/generate')
      .set('Authorization', `Bearer ${employeeFromOwner2JwtToken}`)
      .send({
        points: 2,
        businessPointCardID: chreatedBusinessPointCardId2,
      })
      .expect(HttpStatus.CREATED);

    const responseBody = JSON.parse(response.text);

    expect(qrCodeToken).toBeDefined();
    expect(responseBody.token).toBeDefined();
  });

  it('/qrcode/receive (POST) - should receive QR code successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/qrcode/receive') // Änderung zu POST und neue URL
      .send({ token: qrCodeToken }) // Senden des Tokens im Body
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.CREATED);

    // Überprüfen der Antwort
    expect(response.body).toBeDefined();
    expect(response.body).toEqual({
      newCards: expect.any(Array), // Erwarte ein Array, Details sind nicht wichtig für den Test
      updatedCard: expect.objectContaining({
        // Stelle sicher, dass die aktualisierte Karte bestimmte Eigenschaften hat
        _id: expect.any(String),
        cardIsFullToken: expect.any(String),
        hasFullPoints: false,
        isScanned: false,
        pointCard: expect.objectContaining({
          _id: expect.any(String),
          company: expect.objectContaining({
            _id: expect.any(String),
            companyName: 'Example Company',
          }),
        }),
        points: expect.any(Array), // Erwarte ein Array für Punkte, Details sind für den Test nicht wichtig
      }),
    });
  });

  it('/qrcode/generate (POST) - should fail without authentication', async () => {
    await request(app.getHttpServer())
      .post('/qrcode/generate')
      .send({
        points: 2,
        businessPointCardID: chreatedBusinessPointCardId,
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/qrcode/generate (POST) - should fail with invalid data', async () => {
    await request(app.getHttpServer())
      .post('/qrcode/generate')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({
        // Ungültige Daten, z.B. fehlende 'points'
        businessPointCardID: chreatedBusinessPointCardId,
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/qrcode/receive (POST) - should fail without authentication', async () => {
    await request(app.getHttpServer())
      .post('/qrcode/receive') // Changed to POST and new URL
      .send({ token: qrCodeToken }) // Token sent in the body
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/qrcode/receive (POST) - should fail with invalid or expired token', async () => {
    const invalidToken = 'someInvalidToken';
    await request(app.getHttpServer())
      .post('/qrcode/receive') // Changed to POST and new URL
      .send({ token: invalidToken }) // Invalid token sent in the body
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/qrcode/generate (POST) - should fail with wrong PointCardId', async () => {
    const response = await request(app.getHttpServer())
      .post('/qrcode/generate')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({
        points: 2,
        businessPointCardID: chreatedBusinessPointCardId2,
      })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body.timestamp).toBeDefined();
    expect(response.body.statusCode).toEqual(401);
    expect(response.body.message).toEqual(
      'You are not authorized to create a QrToken for the PointCard.',
    );
    expect(response.body.path).toEqual('/qrcode/generate');
  });

  it('/qrcode/generate (POST) - should fail with wrong PointCardId', async () => {
    const response = await request(app.getHttpServer())
      .post('/qrcode/generate')
      .set('Authorization', `Bearer ${employeeFromOwner2JwtToken}`)
      .send({
        points: 2,
        businessPointCardID: chreatedBusinessPointCardId,
      })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body.timestamp).toBeDefined();
    expect(response.body.statusCode).toEqual(401);
    expect(response.body.message).toEqual(
      'You are not authorized to create a QrToken for the PointCard.',
    );
    expect(response.body.path).toEqual('/qrcode/generate');
  });

  afterAll(async () => {
    await clearTestDB();
    //deactivate testmode
    process.env.TESTMODE = 'false';
    await app.close();
  });
});
