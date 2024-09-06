import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { clearTestDB } from '../../test/database.utils';
import {
  loginUser,
  registerOwner,
  registerOwner2,
  registerUser,
  updateRole,
} from '../../test/user.utils';
import { createBusinessPointCard } from '../../test/pointCard.utils';
import {
  createCustomerPointCard,
  updatePointCreatedAtToPast,
} from '../../test/customerPointCard.utils';
import { generateQRCode10points, receiveQRCode } from '../../test/qrCode.utils';
import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
/**
 * Datei: analytics.controller.spec.ts
 * Autor: Basil Peter
 *Datum: 24.08.2024
 */

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication;
  let userJwtToken: string;
  let ownerJwtToken: string;
  let secondOwnerJwtToken: string;
  let pointCard: any;
  let secondpointCard: any;

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

    // Registrieren von Benutzer und Eigentümer
    await registerUser(app);
    await registerOwner(app);
    await registerOwner2(app);

    // change role for user (mock a buy)
    await updateRole('basil.owner@example.com', 'PlatinumOwner');

    const userTokens = await loginUser(app, 'test@example.com', 'Test1234!');
    const ownerTokens = await loginUser(
      app,
      'basil.owner@example.com',
      'Test1234!',
    );

    const secondOwnerTokens = await loginUser(
      app,
      'basil.owner2@example.com',
      'Test1234!',
    );

    secondOwnerJwtToken = secondOwnerTokens.accessToken;
    userJwtToken = userTokens.accessToken;
    ownerJwtToken = ownerTokens.accessToken;

    // Erstellen einer Business-Point-Card
    pointCard = await createBusinessPointCard(app, ownerJwtToken, {
      name: 'owner2Burgers',
      maxpoints: 10,
      discount: 25,
      description: 'Jeder 10te Burger ist gratis',
    });

    // Erstellen eine weitere Business-Point-Card ohne dem User diese zuzuweisen
    secondpointCard = await createBusinessPointCard(app, ownerJwtToken, {
      name: 'owner2Burgers2',
      maxpoints: 10,
      discount: 25,
      description: 'Jeder 10te Burger ist gratis',
    });

    secondpointCard = secondpointCard;

    //erstelle eine customerPointCard
    const customerPointCard = await createCustomerPointCard(
      app,
      userJwtToken,
      pointCard._id,
    );

    const generatedQrToken = await generateQRCode10points(
      app,
      ownerJwtToken,
      pointCard._id,
    );
    await receiveQRCode(app, userJwtToken, generatedQrToken);

    await updatePointCreatedAtToPast(customerPointCard._id);
  });

  // Testet die Rückgabe von Punktedaten für eine Business-Point-Card (innerhalb von 24 Stunden)
  it('should return points data(24h) for a given businessPointCardId ', async () => {
    const response = await request(app.getHttpServer())
      .get(`/analytics/pointsByPointCrads`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(200);

    // Überprüft, ob die Antwortdaten korrekt definiert sind und die erwartete Anzahl an Ergebnissen zurückgegeben wird
    expect(response.body).toBeDefined();
    expect(response.body.length).toBe(2);
  });

  // Testet, ob ein anderer Eigentümer ebenfalls Punktedaten abrufen kann
  it('should return points data(24h) for a given businessPointCardId ', async () => {
    const response = await request(app.getHttpServer())
      .get(`/analytics/pointsByPointCrads`)
      .set('Authorization', `Bearer ${secondOwnerJwtToken}`)
      .expect(200);

    // Überprüft, ob die Antwortdaten korrekt definiert sind
    expect(response.body).toBeDefined();
  });

  // Testet den Zugriff eines Benutzers auf die Punktedaten, sollte nicht erlaubt sein (403 Forbidden)
  it('should return points data(24h) for a given businessPointCardId ', async () => {
    const response = await request(app.getHttpServer())
      .get(`/analytics/pointsByPointCrads`)
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(403);

    // Überprüft, ob die Antwortdaten korrekt definiert sind und die Berechtigung verweigert wird
    expect(response.body).toBeDefined();
  });

  // Testet den Fall, wenn kein Authentifizierungs-Token bereitgestellt wird (401 Unauthorized)
  it('/analytics/pointsByPointCrads (GET) - fail when no authentication token is provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/pointsByPointCrads')
      .expect(401);

    // Überprüft, ob die Fehlermeldung für nicht authentifizierte Anfragen korrekt zurückgegeben wird
    expect(response.body).toBeDefined();
    expect(response.body.message).toBe('Unauthorized');
  });

  // Testet den Fall, wenn ein ungültiges Authentifizierungs-Token bereitgestellt wird (401 Unauthorized)
  it('/analytics/pointsByPointCrads (GET) - fail with invalid authentication token', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/pointsByPointCrads')
      .set('Authorization', `Bearer invalidToken`)
      .expect(401);

    // Überprüft, ob die Fehlermeldung für ungültige Tokens korrekt zurückgegeben wird
    expect(response.body).toBeDefined();
    expect(response.body.message).toBe('Unauthorized');
  });

  afterAll(async () => {
    await clearTestDB();

    //deactivate testmode
    process.env.TESTMODE = 'false';

    await app.close();
  });
});
