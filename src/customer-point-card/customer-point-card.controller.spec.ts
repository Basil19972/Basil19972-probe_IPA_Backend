import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { clearTestDB } from '../../test/database.utils';
import { loginUser, registerOwner, registerUser } from '../../test/user.utils';
import { createBusinessPointCard } from '../../test/pointCard.utils';
import * as request from 'supertest';
import { Types } from 'mongoose';
import {
  createCustomerPointCard,
  getAllCustomerPointCards,
} from '../../test/customerPointCard.utils';
import { receiveQRCode, generateQRCode10points } from '../../test/qrCode.utils';

describe('CustomerPointCardController (e2e)', () => {
  let app: INestApplication;
  let userJwtToken: string;
  let ownerJwtToken: string;
  let pointCard: any;
  let secondpointCard: any;
  let customerPointCardId: string;
  let cardIsFullToken: string;

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

    const userTokens = await loginUser(app, 'test@example.com', 'Test1234!');
    const ownerTokens = await loginUser(
      app,
      'basil.owner@example.com',
      'Test1234!',
    );

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
    await createCustomerPointCard(app, userJwtToken, pointCard._id);

    const generatedQrToken = await generateQRCode10points(
      app,
      ownerJwtToken,
      pointCard._id,
    );
    await receiveQRCode(app, userJwtToken, generatedQrToken);

    const allCustomerPointCards = await getAllCustomerPointCards(
      app,
      userJwtToken,
    );
    cardIsFullToken = allCustomerPointCards[0].cardIsFullToken;
  });
  //Start with Tests here

  it('/customer-point-card (POST) - create customer point card (user have the CustomerPointCard already)', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-point-card')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({
        pointCardID: pointCard._id,
      })
      .expect(HttpStatus.CREATED);

    // Überprüfen, ob die Antwort definiert ist
    expect(response.body).toBeDefined();

    // Überprüfen, ob die pointCardId in der Antwort mit der gesendeten übereinstimmt
    expect(response.body.pointCard).toEqual(pointCard._id);

    // Überprüfen, ob die weiteren erwarteten Felder vorhanden sind
    expect(response.body).toHaveProperty('points');
    expect(response.body).toHaveProperty('hasFullPoints');
    expect(response.body).toHaveProperty('_id');

    // Überprüfen spezifischer Werte
    expect(response.body.points).toEqual([]);
    expect(response.body.hasFullPoints).toBe(false);

    // Optional: Überprüfen der Typen der Felder
    expect(typeof response.body._id).toBe('string');
    expect(Array.isArray(response.body.points)).toBe(true);
    expect(typeof response.body.hasFullPoints).toBe('boolean');

    customerPointCardId = response.body._id;
  });

  it('/customer-point-card (POST) - create customer point card (user dont have the CustomerPointCard)', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-point-card')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({
        pointCardID: secondpointCard._id,
      })
      .expect(HttpStatus.CREATED);

    // Überprüfen, ob die Antwort definiert ist
    expect(response.body).toBeDefined();

    // Überprüfen, ob die pointCardId in der Antwort mit der gesendeten übereinstimmt

    // Überprüfen, ob die weiteren erwarteten Felder vorhanden sind
    expect(response.body).toHaveProperty('points');
    expect(response.body).toHaveProperty('hasFullPoints');
    expect(response.body).toHaveProperty('_id');

    // Überprüfen spezifischer Werte
    expect(response.body.points).toEqual([]);
    expect(response.body.hasFullPoints).toBe(false);

    // Optional: Überprüfen der Typen der Felder
    expect(typeof response.body._id).toBe('string');
    expect(Array.isArray(response.body.points)).toBe(true);
    expect(typeof response.body.hasFullPoints).toBe('boolean');
  });

  it('/customer-point-card (POST) - should fail without a token', async () => {
    await request(app.getHttpServer())
      .post('/customer-point-card')
      .send({ pointCardID: pointCard._id })
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  it('/customer-point-card (POST) - should fail with an invalid token', async () => {
    await request(app.getHttpServer())
      .post('/customer-point-card')
      .set('Authorization', `Bearer invalidToken`)
      .send({ pointCardID: pointCard._id })
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  it('/customer-point-card (POST) - should fail without pointCardID', async () => {
    await request(app.getHttpServer())
      .post('/customer-point-card')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({})
      .expect(HttpStatus.BAD_REQUEST); // Erwartet 400 Bad Request
  });

  it('/customer-point-card (POST) - should fail with an invalid pointCardID', async () => {
    await request(app.getHttpServer())
      .post('/customer-point-card')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({ pointCardID: 'invalidID' })
      .expect(HttpStatus.BAD_REQUEST); // Erwartet 400 Bad Request
  });

  it.skip('/customer-point-card (POST) - should fail when trying to create a duplicate point card', async () => {
    // Erstellt eine Point Card
    await request(app.getHttpServer())
      .post('/customer-point-card')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({ pointCardID: pointCard._id })
      .expect(HttpStatus.CREATED);

    // Versucht, dieselbe Point Card erneut zu erstellen
    await request(app.getHttpServer())
      .post('/customer-point-card')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({ pointCardID: pointCard._id })
      .expect(HttpStatus.BAD_REQUEST); // Erwartet 400 Bad Request oder einen anderen relevanten Statuscode
  });

  it('/customer-point-card (POST) - should fail with extra fields in the body', async () => {
    await request(app.getHttpServer())
      .post('/customer-point-card')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({ pointCardID: pointCard._id, extraField: 'extraValue' })
      .expect(HttpStatus.BAD_REQUEST); // Erwartet 400 Bad Request
  });

  it('/customer-point-card (GET) - get all customer point cards for user', async () => {
    const response = await request(app.getHttpServer())
      .get('/customer-point-card')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.OK);

    // Überprüfen, ob die Antwort definiert ist
    expect(response.body).toBeDefined();

    // Überprüfen, ob die Antwort ein Array ist
    expect(Array.isArray(response.body)).toBe(true);

    // Überprüfen, ob das Array mindestens ein Element enthält
    expect(response.body.length).toBeGreaterThan(0);

    // Finden der spezifischen Customer Point Card anhand der gespeicherten ID
    const foundCard = response.body.find(
      (card) => card._id === customerPointCardId,
    );

    // Überprüfen, ob die Karte mit der gespeicherten ID gefunden wurde
    expect(foundCard).toBeDefined();

    // Überprüfen spezifischer Eigenschaften der gefundenen Karte
    if (foundCard) {
      expect(foundCard._id).toEqual(customerPointCardId);
      expect(foundCard).toHaveProperty('points');
      expect(foundCard).toHaveProperty('pointCard');
      expect(foundCard).toHaveProperty('hasFullPoints');
    }
  });

  it('/customer-point-card (GET) - should fail without a token', async () => {
    await request(app.getHttpServer())
      .get('/customer-point-card')
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  it('/customer-point-card (GET) - should fail with an invalid token', async () => {
    await request(app.getHttpServer())
      .get('/customer-point-card')
      .set('Authorization', `Bearer invalidToken`)
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  it('/customer-point-card (GET) - should fail for an invalid URL', async () => {
    await request(app.getHttpServer())
      .get('/invalid-customer-point-card-url')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.NOT_FOUND); // Erwartet 404 Not Found
  });

  it('/customer-point-card/:id (DELETE) - delete a customer point card', async () => {
    // Verwenden der gespeicherten ID einer existierenden Customer Point Card
    const response = await request(app.getHttpServer())
      .delete(`/customer-point-card/${customerPointCardId}`)
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.OK);

    // Überprüfen, ob die Antwort leer ist (da erwartet wird, dass der Body leer ist)
    expect(response.body).toEqual({});

    // Optional: Zusätzliche Überprüfung, ob die gelöschte Karte nicht mehr abgerufen werden kann
    const getResponse = await request(app.getHttpServer())
      .get(`/customer-point-card/${customerPointCardId}`)
      .set('Authorization', `Bearer ${userJwtToken}`);

    expect(getResponse.status).not.toBe(HttpStatus.OK);
  });

  it('should fail to delete a customer point card without a token', async () => {
    await request(app.getHttpServer())
      .delete(`/customer-point-card/${customerPointCardId}`)
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  it('should fail to delete a customer point card with an invalid token', async () => {
    await request(app.getHttpServer())
      .delete(`/customer-point-card/${customerPointCardId}`)
      .set('Authorization', 'Bearer invalid_token')
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  it('should fail to delete a non-existent customer point card', async () => {
    const nonExistentId = new Types.ObjectId();

    await request(app.getHttpServer())
      .delete(`/customer-point-card/${nonExistentId}`)
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.NOT_FOUND); // Erwartet 404 Not Found oder 400 Bad Request
  });

  it('should fail to delete a customer point card with invalid ID format', async () => {
    const invalidId = 'invalid_id_format';
    await request(app.getHttpServer())
      .delete(`/customer-point-card/${invalidId}`)
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST); // Erwartet 400 Bad Request
  });

  it('/redeem (POST) - should successfully scan token', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-point-card/redeem')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({ token: cardIsFullToken })
      .expect(HttpStatus.CREATED);

    // Überprüfen, ob die Antwort definiert ist
    expect(response.body).toBeDefined();
  });

  it('/redeem (POST) - should fail if token is already used', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-point-card/redeem')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({ token: cardIsFullToken });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('statusCode', 500);
    expect(response.body).toHaveProperty('message', 'Token already used.');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('path', '/customer-point-card/redeem');
  });

  it('/redeem (POST) - should fail without a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-point-card/redeem')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({});

    expect(response.statusCode).toBe(400); // Überprüfen des Statuscodes
    expect(response.body).toHaveProperty('statusCode', 400); // Überprüfen des statusCode im Body
    expect(response.body).toHaveProperty('message'); // Überprüfen der Nachricht
    expect(Array.isArray(response.body.message)).toBeTruthy(); // Stellen Sie sicher, dass die Nachricht ein Array ist
    expect(response.body.message).toContain('token should not be empty'); // Überprüfen des Nachrichteninhalts
    expect(response.body).toHaveProperty('timestamp'); // Überprüfen des Vorhandenseins eines Zeitstempels
    expect(response.body).toHaveProperty('path', '/customer-point-card/redeem');
  });

  it('/redeem (POST) - should fail with an invalid token', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-point-card/redeem')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({ token: 'invalidToken' });

    expect(response.statusCode).toBe(500); // Überprüfen des Statuscodes
    expect(response.body).toHaveProperty('statusCode', 500); // Überprüfen des statusCode im Body
    expect(response.body).toHaveProperty('message', 'jwt malformed'); // Überprüfen der Nachricht
    expect(response.body).toHaveProperty('timestamp'); // Überprüfen des Vorhandenseins eines Zeitstempels
    expect(response.body).toHaveProperty('path', '/customer-point-card/redeem');
  });

  it('/redeem (POST) - should fail without authorization', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-point-card/redeem')
      .send({ token: cardIsFullToken });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('statusCode', 401);
    expect(response.body).toHaveProperty('message', 'Unauthorized');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('path', '/customer-point-card/redeem');
  });

  afterAll(async () => {
    await clearTestDB();

    //deactivate testmode
    process.env.TESTMODE = 'false';

    await app.close();
  });
});
