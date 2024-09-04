import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import {
  loginUser,
  registerOwner,
  registerOwner2,
  registerUser,
} from '../../test/user.utils';
import { createBusinessPointCard } from '../../test/pointCard.utils';
import { createCustomerPointCard } from '../../test/customerPointCard.utils';
import * as request from 'supertest';

describe('SseController (e2e)', () => {
  let app: INestApplication;
  let owner2JwtToken: string; // Token für den Eigentümer
  let ownerJwtToken: string; // Token für den Eigentümer
  let userJwtToken: string; // Token für den Benutzer

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
    await registerOwner2(app);
    await registerUser(app);

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

    userJwtToken = userTokens.accessToken;
    ownerJwtToken = ownerTokens.accessToken;
    owner2JwtToken = ownerTokens2.accessToken;

    // Erstellen einer Business-Point-Card
    const pointCard = await createBusinessPointCard(app, ownerJwtToken, {
      name: 'owner2Burgers',
      maxpoints: 10,
      discount: 25,
      description: 'Jeder 10te Burger ist gratis',
    });

    // Erstellen eine weitere Business-Point-Card ohne dem User diese zuzuweisen
    const secondpointCard = await createBusinessPointCard(app, owner2JwtToken, {
      name: 'owner2Burgers2',
      maxpoints: 10,
      discount: 25,
      description: 'Jeder 10te Burger ist gratis',
    });

    await createCustomerPointCard(app, userJwtToken, pointCard._id);
    await createCustomerPointCard(app, userJwtToken, secondpointCard._id);
  });

  /*
  it('both owners should register for SSE events and receive an event when a QR code is scanned', (done) => {
    const url = 'http://localhost:3000/sse/events';

    const eventSourceInitDictOwner1 = {
      headers: {
        Authorization: `Bearer ${ownerJwtToken}`,
      },
    };

    const eventSourceInitDictOwner2 = {
      headers: {
        Authorization: `Bearer ${owner2JwtToken}`,
      },
    };
    const es = new EventSource(url, eventSourceInitDictOwner1);

    // Implementieren Sie die Logik, um auf Events zu warten und sie zu überprüfen
    // Dies ist ein einfaches Beispiel, das darauf wartet, dass ein Event von einem der Streams empfangen wird
    eventSourceOwner1.onmessage = function (event) {
      console.log('Owner 1 received event:', event.data);
      expect(event.data).toBeDefined();

      // Schließen Sie die Verbindungen, nachdem das Event empfangen wurde
      eventSourceOwner1.close();
      eventSourceOwner2.close();
      done();
    };

    eventSourceOwner2.onmessage = function (event) {
      console.log('Owner 2 received event:', event.data);
      expect(event.data).toBeDefined();

      // Schließen Sie die Verbindungen, nachdem das Event empfangen wurde
      eventSourceOwner1.close();
      eventSourceOwner2.close();
      done();
    };

   
  });
      */

  it.skip('register owner for See', async () => {
    const response = await request(app.getHttpServer())
      .get('/sse/events')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    console.log(response.body);
  });

  // Weitere Tests für SSE-Events und die Interaktion mit dem SseService könnten hier folgen

  afterAll(async () => {
    await app.close();

    //deactivate testmode
    process.env.TESTMODE = 'false';
  });
});
