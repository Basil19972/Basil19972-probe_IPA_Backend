import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { clearTestDB } from '../../test/database.utils';
import {
  loginUser,
  registerOwner,
  registerUser,
  updateRole,
} from '../../test/user.utils';
import * as request from 'supertest';
import {} from '../../test/customerPointCard.utils';

describe('CustomerPointCardController (e2e)', () => {
  let app: INestApplication;
  let userJwtToken: string;
  let ownerJwtToken: string;
  let offerToken: string;

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

    // change role for user (mock a buy)
    await updateRole('basil.owner@example.com', 'GoldOwner');
  });
  //Start with Tests here

  it('should create an offer successfully with owner token', async () => {
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 10000);
    const offerDto = {
      title: 'Gratis Winterservice',
      productName: 'Autoservice',
      description: 'Wir machen ihr auto fit für den Winter',
      discount: 25,
      customerLevelRange: [1, 4],
      amountOfScans: 3,
      startDate: currentDate.toISOString(),
    };

    const response = await request(app.getHttpServer())
      .post('/offer/create')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(offerDto)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      title: 'Gratis Winterservice',
      productName: 'Autoservice',
      description: 'Wir machen ihr auto fit für den Winter',
      discount: 25,
      company: expect.any(String),
      customerLevelRange: [1, 4],
      amountOfScans: 3,
      startDate: expect.any(String), // Da das Datum formatiert sein könnte
      _id: expect.any(String),
      userScans: expect.any(Array),
      endDate: expect.any(String), // Da das Datum formatiert sein könnte
      offerToken: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      __v: 0,
    });

    offerToken = response.body.offerToken;
  });

  it('should create an offer successfully without amountOfScans with owner token', async () => {
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 10000);
    const offerDto = {
      title: 'Gratis Winterservice',
      productName: 'Autoservice',
      description: 'Wir machen ihr auto fit für den Winter',
      discount: 25,
      customerLevelRange: [1, 4],
      startDate: currentDate.toISOString(),
    };

    const response = await request(app.getHttpServer())
      .post('/offer/create')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(offerDto)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      title: 'Gratis Winterservice',
      productName: 'Autoservice',
      description: 'Wir machen ihr auto fit für den Winter',
      discount: 25,
      company: expect.any(String),
      customerLevelRange: [1, 4],
      startDate: expect.any(String), // Da das Datum formatiert sein könnte
      _id: expect.any(String),
      userScans: expect.any(Array),
      endDate: expect.any(String), // Da das Datum formatiert sein könnte
      offerToken: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      __v: 0,
    });
  });

  it('should create an offer successfully without amountOfScans, customerLevelRange with owner token', async () => {
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 10000);
    const offerDto = {
      title: 'Gratis Winterservice',
      productName: 'Autoservice',
      description: 'Wir machen ihr auto fit für den Winter',
      discount: 25,
      startDate: currentDate.toISOString(),
    };

    const response = await request(app.getHttpServer())
      .post('/offer/create')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(offerDto)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      title: 'Gratis Winterservice',
      productName: 'Autoservice',
      description: 'Wir machen ihr auto fit für den Winter',
      discount: 25,
      company: expect.any(String),
      startDate: expect.any(String), // Da das Datum formatiert sein könnte
      _id: expect.any(String),
      userScans: expect.any(Array),
      endDate: expect.any(String), // Da das Datum formatiert sein könnte
      offerToken: expect.any(String),
      createdAt: expect.any(String),
      customerLevelRange: [],
      updatedAt: expect.any(String),
      __v: 0,
    });
  });

  it('should fail to create an offer with user token', async () => {
    const offerDto = {
      title: 'Gratis Wintersercive',
      productName: 'Autoservice',
      description: 'Wir machen ihr auto fit für den Winter',
      discount: 25,
      customerLevelRange: [1, 4],
      amountOfScans: 3,
      startDate: new Date().toISOString(),
    };
    const response = await request(app.getHttpServer())
      .post('/offer/create')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send(offerDto)
      .expect(HttpStatus.FORBIDDEN);

    expect(response.body).toEqual({
      statusCode: 403,
      message: 'Forbidden resource',
      timestamp: expect.any(String),
      path: '/offer/create',
    });
  });

  // Funktion zur Überprüfung der Grundstruktur des Antwortkörpers
  function checkOfferResponseStructure(responseBody) {
    expect(responseBody).toEqual({
      _id: expect.any(String),
      title: 'Gratis Winterservice',
      productName: 'Autoservice',
      description: 'Wir machen ihr auto fit für den Winter',
      discount: 25,
      company: expect.any(String),
      customerLevelRange: [1, 4],
      amountOfScans: 3,
      startDate: expect.any(String),
      userScans: expect.arrayContaining([expect.any(Object)]),
      endDate: expect.any(String),
      offerToken: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      __v: expect.any(Number),
    });
  }

  it('should succeed to scan offer with user token (first scan)', async () => {
    const tokenDto = { token: `${offerToken}` };

    const response = await request(app.getHttpServer())
      .post('/offer/scan')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send(tokenDto)
      .expect(HttpStatus.CREATED);

    checkOfferResponseStructure(response.body);
  });

  it('should succeed to scan offer with user token (second scan)', async () => {
    const tokenDto = { token: `${offerToken}` };

    const response = await request(app.getHttpServer())
      .post('/offer/scan')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send(tokenDto)
      .expect(HttpStatus.CREATED);

    checkOfferResponseStructure(response.body);
  });

  it('should succeed to scan offer with user token (third scan)', async () => {
    const tokenDto = { token: `${offerToken}` };

    const response = await request(app.getHttpServer())
      .post('/offer/scan')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send(tokenDto)
      .expect(HttpStatus.CREATED);

    checkOfferResponseStructure(response.body);
  });

  it('should fail to scan offer with user token (fourth scan - exceeds limit)', async () => {
    const tokenDto = {
      token: `${offerToken}`,
    };

    const response = await request(app.getHttpServer())
      .post('/offer/scan')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send(tokenDto)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(response.body).toEqual({
      statusCode: 500,
      message: 'You have reached the scan limit.',
      timestamp: expect.any(String),
      path: '/offer/scan',
    });
  });

  it('should deny scanning an offer without a JWT token', async () => {
    const tokenDto = { token: `${offerToken}` };

    const response = await request(app.getHttpServer())
      .post('/offer/scan')
      .send(tokenDto)
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
      path: '/offer/scan',
      timestamp: expect.any(String),
      // Weitere erwartete Fehlerdetails
    });
  });

  it('should not allow creating an offer with a start date in the past', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Einen Tag in der Vergangenheit
    const offerDto = {
      title: 'Angebot in der Vergangenheit',
      productName: 'Testprodukt',
      description: 'Testbeschreibung',
      discount: 10,
      customerLevelRange: [1, 4],
      amountOfScans: 1,
      startDate: pastDate.toISOString(),
    };

    const response = await request(app.getHttpServer())
      .post('/offer/create')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(offerDto)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'The offers start date is in the past.',
      path: '/offer/create',
      timestamp: expect.any(String),
      // Weitere erwartete Fehlerdetails
    });
  });

  afterAll(async () => {
    await clearTestDB();

    //deactivate testmode
    process.env.TESTMODE = 'false';

    await app.close();
  });
});
