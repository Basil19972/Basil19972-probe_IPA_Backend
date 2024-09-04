import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { clearTestDB } from '../../test/database.utils';
import { loginUser, registerOwner } from '../../test/user.utils';
import * as request from 'supertest';
import { Types } from 'mongoose';

describe('PointCardController (e2e)', () => {
  let app: INestApplication;
  let ownerJwtToken: string;
  let pointCardId: string;

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
    await registerOwner(app);

    const ownerTokens = await loginUser(
      app,
      'basil.owner@example.com',
      'Test1234!',
    );

    ownerJwtToken = ownerTokens.accessToken;
  });

  it('/business-point-card (POST) - create a point card', async () => {
    const response = await request(app.getHttpServer())
      .post('/business-point-card')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({
        name: 'Burger',
        maxpoints: 10,
        discount: 25,
        description: 'Jeder 10te Burger ist gratis',
      })
      .expect(HttpStatus.CREATED);

    // Speichern der ID für spätere Verwendung
    pointCardId = response.body._id;
  });

  it('should fail to create a point card without authentication', async () => {
    await request(app.getHttpServer())
      .post('/business-point-card')
      .send({ name: 'Burger', maxpoints: 10, discount: 25 })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should fail to create a point card with invalid token', async () => {
    await request(app.getHttpServer())
      .post('/business-point-card')
      .set('Authorization', 'Bearer invalid_token')
      .send({ name: 'Burger', maxpoints: 10, discount: 25 })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should fail to create a point card without required fields', async () => {
    await request(app.getHttpServer())
      .post('/business-point-card')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({ name: 'Burger' }) // maxpoints fehlt
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should fail to create a point card with invalid data', async () => {
    await request(app.getHttpServer())
      .post('/business-point-card')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({ name: 'Burger', maxpoints: -10, discount: 25 }) // Ungültiger Wert für maxpoints
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should fail to create a point card with invalid discount', async () => {
    await request(app.getHttpServer())
      .post('/business-point-card')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({ name: 'Burger', maxpoints: 10, discount: 21 }) // Ungültiger Wert für discount
      .expect(HttpStatus.BAD_REQUEST);
  });

  it.skip('should fail to create a duplicate point card', async () => {
    // Zuerst eine gültige Punktekarte erstellen
    await request(app.getHttpServer())
      .post('/business-point-card')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({ name: 'Burger', maxpoints: 10, discount: 25 })
      .expect(HttpStatus.CREATED);

    // Versuch, dieselbe Punktekarte zu erstellen
    await request(app.getHttpServer())
      .post('/business-point-card')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({ name: 'Burger', maxpoints: 10, discount: 25 })
      .expect(HttpStatus.CONFLICT); // Oder ein anderer passender Statuscode, der Duplikate anzeigt
  });

  it('/business-point-card (GET) - get all point cards for user', async () => {
    const response = await request(app.getHttpServer())
      .get('/business-point-card')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    // Überprüfen, ob die Antwort das erwartete Objekt enthält
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: expect.any(String),
          name: expect.any(String),
          maxpoints: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          __v: expect.any(Number),
        }),
      ]),
    );

    // Überprüfen Sie spezifische Eigenschaften
    const pointCard = response.body.find((card) => card._id === pointCardId);
    expect(pointCard).toBeDefined();
    expect(pointCard.name).toBe('Burger');
    expect(pointCard.maxpoints).toBe(10);
    expect(pointCard.__v).toBe(0);
  });

  it('should fail to get point cards without authentication', async () => {
    await request(app.getHttpServer())
      .get('/business-point-card')
      .expect(HttpStatus.UNAUTHORIZED); // Ersetzen Sie UNAUTHORIZED durch den tatsächlichen Statuscode, den Ihre API für fehlende Authentifizierung zurückgibt
  });

  it('should fail to get point cards with invalid token', async () => {
    await request(app.getHttpServer())
      .get('/business-point-card')
      .set('Authorization', 'Bearer invalid_token')
      .expect(HttpStatus.UNAUTHORIZED); // Oder ein anderer passender Statuscode für ungültige Authentifizierung
  });

  it('/business-point-card/:id (GET) - get a specific point card', async () => {
    const response = await request(app.getHttpServer())
      .get(`/business-point-card/${pointCardId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    // Überprüfen der Antwort
    expect(response.body._id).toEqual(pointCardId);
    expect(response.body.name).toEqual('Burger');
    expect(response.body.maxpoints).toEqual(10);

    // Hier können Sie zusätzliche Überprüfungen hinzufügen
  });

  it('/business-point-card/:id (PUT) - successfully update a point card', async () => {
    const updatedData = {
      name: 'Burger Deluxe',
      description: 'Jeder 20te Burger ist gratis und extra groß',
    };

    const response = await request(app.getHttpServer())
      .put(`/business-point-card/?pointCardId=${pointCardId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updatedData)
      .expect(HttpStatus.OK);

    expect(response.body.name).toEqual(updatedData.name);
    expect(response.body.description).toEqual(updatedData.description);
  });

  it('/business-point-card/:id (PUT) - successfully update a point card only name', async () => {
    const updatedData = {
      name: 'Burger Deluxe Test 2',
    };

    const response = await request(app.getHttpServer())
      .put(`/business-point-card/?pointCardId=${pointCardId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updatedData)
      .expect(HttpStatus.OK);

    expect(response.body.name).toEqual(updatedData.name);
  });

  it('/business-point-card/:id (PUT) - successfully update a point card only name', async () => {
    const updatedData = {
      description: 'Jeder 20te Burger ist gratis und extra groß Test',
    };

    const response = await request(app.getHttpServer())
      .put(`/business-point-card/?pointCardId=${pointCardId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updatedData)
      .expect(HttpStatus.OK);

    expect(response.body.description).toEqual(updatedData.description);
  });

  it('/business-point-card/:id (PUT) - failed update a point Card to short description', async () => {
    const updatedData = {
      description: 'To short',
    };

    const response = await request(app.getHttpServer())
      .put(`/business-point-card/?pointCardId=${pointCardId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updatedData)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toEqual(400);
    expect(response.body.message).toEqual([
      'description must be longer than or equal to 20 characters',
    ]);
  });

  it('/business-point-card/:id (PUT) - failed update a point Card wrong attributes', async () => {
    const updatedData = {
      maxpoints: 20,
      discount: 20,
    };

    const response = await request(app.getHttpServer())
      .put(`/business-point-card/?pointCardId=${pointCardId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updatedData)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toEqual(400);
    expect(response.body.message).toEqual([
      'property maxpoints should not exist',
      'property discount should not exist',
    ]);
  });

  it('should fail to get a specific point card without authentication', async () => {
    await request(app.getHttpServer())
      .get(`/business-point-card/${pointCardId}`)
      .expect(HttpStatus.UNAUTHORIZED); // Ersetzen Sie UNAUTHORIZED durch den tatsächlichen Statuscode, den Ihre API für fehlende Authentifizierung zurückgibt
  });

  it('should fail to get a specific point card with invalid token', async () => {
    await request(app.getHttpServer())
      .get(`/business-point-card/${pointCardId}`)
      .set('Authorization', 'Bearer invalid_token')
      .expect(HttpStatus.UNAUTHORIZED); // Oder ein anderer passender Statuscode für ungültige Authentifizierung
  });

  it('should fail to get a point card with non-existing id', async () => {
    const nonExistingId = new Types.ObjectId();
    await request(app.getHttpServer())
      .get(`/business-point-card/${nonExistingId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.NOT_FOUND); // Oder ein anderer passender Statuscode für nicht gefundene Ressourcen
  });

  it('should fail to get a point card with invalid id format', async () => {
    const invalidId = '12345'; // Ein Beispiel für eine ungültige ID
    await request(app.getHttpServer())
      .get(`/business-point-card/${invalidId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST); // Oder ein anderer passender Statuscode für fehlerhafte Anfragen
  });

  it('/business-point-card/:id (DELETE) - delete a specific point card', async () => {
    await request(app.getHttpServer())
      .delete(`/business-point-card/${pointCardId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);
  });

  it('/business-point-card/:id (DELETE) - fail to delete a point card with invalid id format', async () => {
    const invalidId = '123';
    await request(app.getHttpServer())
      .delete(`/business-point-card/${invalidId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/business-point-card/:id (DELETE) - fail to delete a non-existing point card', async () => {
    const nonExistingId = new Types.ObjectId();
    await request(app.getHttpServer())
      .delete(`/business-point-card/${nonExistingId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('/business-point-card/:id (DELETE) - fail to delete a point card without authorization', async () => {
    await request(app.getHttpServer())
      .delete(`/business-point-card/${pointCardId}`)
      // Nicht setzen des Authorization Headers
      .expect(HttpStatus.UNAUTHORIZED); // Oder HttpStatus.FORBIDDEN, abhängig von Ihrer Authentifizierungslogik
  });

  it('should fail to create a fifth point card due to maximum limit reached', async () => {
    // Daten für die fünf Karten
    const pointCards = [
      {
        name: 'Burger 1',
        maxpoints: 10,
        discount: 25,
        description: 'Jeder 10te Burger ist gratis',
      },
      {
        name: 'Burger 2',
        maxpoints: 10,
        discount: 25,
        description: 'Jeder 10te Burger ist gratis',
      },
      {
        name: 'Burger 3',
        maxpoints: 10,
        discount: 25,
        description: 'Jeder 10te Burger ist gratis',
      },
      {
        name: 'Burger 4',
        maxpoints: 10,
        discount: 25,
        description: 'Jeder 10te Burger ist gratis',
      },
      {
        name: 'Burger 5',
        maxpoints: 10,
        discount: 25,
        description: 'Jeder 10te Burger ist gratis',
      }, // Fünfte Karte
    ];

    let createdPointCards = 0;

    // Schleife durch die Karten und Versuch, jede zu erstellen
    for (const pointCard of pointCards) {
      const response = await request(app.getHttpServer())
        .post('/business-point-card')
        .set('Authorization', `Bearer ${ownerJwtToken}`)
        .send(pointCard);

      if (createdPointCards < 4) {
        // Erwartung: Erfolgreiche Erstellung der ersten vier Karten
        expect(response.status).toBe(HttpStatus.CREATED);
        createdPointCards++;
      } else {
        // Erwartung: Fehler bei der fünften Karte aufgrund der Begrenzung
        expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR); // Oder der Statuscode, den du für die Begrenzung verwendest
        expect(response.body.message).toBe(
          'You have reached the limit for the number of point cards.',
        );
      }
    }

    // Überprüfen, dass nur vier Karten erstellt wurden
    expect(createdPointCards).toBe(4);
  });

  afterAll(async () => {
    await clearTestDB();

    //deactivate testmode
    process.env.TESTMODE = 'false';

    await app.close();
  });
});
