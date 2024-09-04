import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { clearTestDB } from '../../test/database.utils';
import * as request from 'supertest';
import {
  loginUser,
  registerOwner,
  registerOwner2,
  registerUser,
} from '../../test/user.utils';
import {
  registerUsersAndCompanies,
  findCompanyByName,
} from '../../test/company.utils';

describe('QrCodeController (e2e)', () => {
  let app: INestApplication;
  let userJwtToken: string;
  let ownerJwtToken: string;
  let owner2JwtToken: string;
  let companyId: string;

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
    const owner = await registerOwner(app);
    await registerOwner2(app);

    await registerUsersAndCompanies(app);

    const ownerTokens = await loginUser(
      app,
      'basil.owner@example.com',
      'Test1234!',
    );
    const userTokens = await loginUser(app, 'test@example.com', 'Test1234!');

    const ownerTokens2 = await loginUser(
      app,
      'basil.owner2@example.com',
      'Test1234!',
    );

    ownerJwtToken = ownerTokens.accessToken;

    owner2JwtToken = ownerTokens2.accessToken;

    userJwtToken = userTokens.accessToken;

    const response = await findCompanyByName(owner.company.companyName);
    companyId = response._id;
  }, 30000);

  it('/company/companiesInRadius (GET) - success with userToken', async () => {
    const response = await request(app.getHttpServer())
      .get('/company/companiesInRadius?longitude=10&latitude=20&radius=5')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toBeInstanceOf(Array);
    // Weitere Überprüfungen je nach Ihrer Logik und Datenstruktur
  });

  it('/company/companiesInRadius (GET) - success with ownerToken', async () => {
    const response = await request(app.getHttpServer())
      .get('/company/companiesInRadius?longitude=10&latitude=20&radius=5')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toBeInstanceOf(Array);
    // Weitere Überprüfungen je nach Ihrer Logik und Datenstruktur
  });

  it('/company/companiesInRadius (GET) - fail due to invalid longitude', async () => {
    await request(app.getHttpServer())
      .get('/company/companiesInRadius?longitude=190&latitude=20&radius=5')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain(
          'longitude must not be greater than 180',
        );
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path');
      });
  });

  it('/company/companiesInRadius (GET) - fail due to invalid latitude', async () => {
    await request(app.getHttpServer())
      .get('/company/companiesInRadius?longitude=10&latitude=100&radius=5')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain(
          'latitude must not be greater than 90',
        );
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path');
      });
  });

  it('/company/companiesInRadius (GET) - fail due to negative radius', async () => {
    await request(app.getHttpServer())
      .get('/company/companiesInRadius?longitude=10&latitude=20&radius=-5')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('radius must not be less than 0');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path');
      });
  });

  it('/company/companiesInRadius (GET) - fail due to no authentication', async () => {
    await request(app.getHttpServer())
      .get('/company/companiesInRadius?longitude=10&latitude=20&radius=5')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/company/companiesInRadius (GET) - fail due to incorrect authentication token', async () => {
    await request(app.getHttpServer())
      .get('/company/companiesInRadius?longitude=10&latitude=20&radius=5')
      .set('Authorization', 'Bearer incorrect-token')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should upload company logo successfully', async () => {
    // Mock a valid SVG file
    const mockFile = {
      fieldname: 'file',
      originalname: 'logo.svg',
      encoding: '7bit',
      mimetype: 'image/svg+xml',
      buffer: Buffer.from('<svg></svg>'),
      size: 1024,
    };

    await request(app.getHttpServer())
      .post('/company/uploadCompanyLogo')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .attach('file', mockFile.buffer, mockFile.originalname)
      .expect(HttpStatus.CREATED);
  });

  it('should throw an error for missing file', async () => {
    await request(app.getHttpServer())
      .post('/company/uploadCompanyLogo')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain(
          'The uploaded file is not a valid SVG file.',
        );
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path');
      });
  });

  it('should throw an error for non-authenticated user', async () => {
    await request(app.getHttpServer())
      .post('/company/uploadCompanyLogo')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should throw an error for incorrect authentication token', async () => {
    await request(app.getHttpServer())
      .post('/company/uploadCompanyLogo')
      .set('Authorization', 'Bearer incorrect-token')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/company/nearest (GET) - success retrieving the first page with 10 companies', async () => {
    const response = await request(app.getHttpServer())
      .get('/company/nearest?longitude=10&latitude=20&page=1&pageSize=10')
      .set('Authorization', `Bearer ${userJwtToken}`) // oder ownerJwtToken, je nachdem, welcher Kontext erforderlich ist
      .expect(HttpStatus.OK);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeLessThanOrEqual(10);
    // Fügen Sie weitere Überprüfungen hinzu, um sicherzustellen, dass die Daten wie erwartet zurückgegeben werden.
  });

  it('/company/nearest (GET) - success retrieving the second page with 10 companies', async () => {
    const response = await request(app.getHttpServer())
      .get('/company/nearest?longitude=10&latitude=20&page=2&pageSize=10')
      .set('Authorization', `Bearer ${userJwtToken}`) // oder ownerJwtToken, je nachdem, welcher Kontext erforderlich ist
      .expect(HttpStatus.OK);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeLessThanOrEqual(10);
    // Prüfen Sie, ob es sich tatsächlich um die zweite Seite der Ergebnisse handelt.
  });

  it('/company/nearest (GET) - success retrieving the second page with 5 companies', async () => {
    const response = await request(app.getHttpServer())
      .get('/company/nearest?longitude=10&latitude=20&page=2&pageSize=5')
      .set('Authorization', `Bearer ${userJwtToken}`) // oder ownerJwtToken, je nachdem, welcher Kontext erforderlich ist
      .expect(HttpStatus.OK);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeLessThanOrEqual(5);
    // Zusätzliche Überprüfungen, um die Korrektheit der zurückgegebenen Daten zu bestätigen.
  });

  it('/company/nearest (GET) - fail without authorization token', async () => {
    const expectedResponse = {
      statusCode: 401,
      message: 'Unauthorized',
      // Der Timestamp ist dynamisch; daher überprüfen wir ihn nicht direkt
      path: '/company/nearest?longitude=10&latitude=20&page=1&pageSize=10',
    };

    await request(app.getHttpServer())
      .get('/company/nearest?longitude=10&latitude=20&page=1&pageSize=10')
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((response) => {
        expect(response.body.statusCode).toBe(expectedResponse.statusCode);
        expect(response.body.message).toBe(expectedResponse.message);
        expect(response.body.path).toBe(expectedResponse.path);
        // Timestamp wird nicht überprüft, da er dynamisch ist
      });
  });

  it('/company/nearest (GET) - fail with invalid authorization token', async () => {
    const expectedResponse = {
      statusCode: 401,
      message: 'Unauthorized',
      path: '/company/nearest?longitude=10&latitude=20&page=1&pageSize=10',
    };

    await request(app.getHttpServer())
      .get('/company/nearest?longitude=10&latitude=20&page=1&pageSize=10')
      .set('Authorization', `Bearer invalidtoken`)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((response) => {
        expect(response.body.statusCode).toBe(expectedResponse.statusCode);
        expect(response.body.message).toBe(expectedResponse.message);
        expect(response.body.path).toBe(expectedResponse.path);
      });
  });

  it('/company/nearest (GET) - fail with invalid longitude and latitude', async () => {
    const expectedMessages = [
      'longitude must not be less than -180',
      'longitude must be a number conforming to the specified constraints',
      'latitude must not be less than -90',
      'latitude must be a number conforming to the specified constraints',
    ];

    await request(app.getHttpServer())
      .get(
        '/company/nearest?longitude=invalid&latitude=invalid&page=1&pageSize=10',
      )
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((response) => {
        expect(response.body.statusCode).toBe(400);
        expect(response.body.message).toEqual(
          expect.arrayContaining(expectedMessages),
        );
        expect(response.body.path).toBe(
          '/company/nearest?longitude=invalid&latitude=invalid&page=1&pageSize=10',
        );
        // Timestamp wird nicht überprüft, da er dynamisch ist
      });
  });

  it('/company/nearest (GET) - fail with invalid page and pageSize values', async () => {
    const expectedMessages = [
      'page must not be less than 1',
      'pageSize must not be greater than 20',
      'pageSize must not be less than 1',
      'pageSize must be a number conforming to the specified constraints',
    ];

    await request(app.getHttpServer())
      .get('/company/nearest?longitude=10&latitude=20&page=-1&pageSize=invalid')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((response) => {
        expect(response.body.statusCode).toBe(400);
        expect(response.body.message).toEqual(
          expect.arrayContaining(expectedMessages),
        );
        expect(response.body.path).toBe(
          '/company/nearest?longitude=10&latitude=20&page=-1&pageSize=invalid',
        );
        // Timestamp wird nicht überprüft, da er dynamisch ist
      });
  });

  it('/company/nearest (GET) - fail requesting a page number beyond available pages', async () => {
    // Angenommen, `pageSize` darf nicht größer als 20 sein
    await request(app.getHttpServer())
      .get('/company/nearest?longitude=10&latitude=20&page=1&pageSize=100') // `pageSize` weit außerhalb des erlaubten Bereichs
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.BAD_REQUEST) // Erwarten Sie, dass der Statuscode 400 Bad Request zurückgegeben wird.
      .expect((response) => {
        expect(response.body.statusCode).toBe(400);
        expect(response.body.message).toEqual([
          'pageSize must not be greater than 20',
        ]);
        expect(response.body.path).toBe(
          '/company/nearest?longitude=10&latitude=20&page=1&pageSize=100',
        );
        // Timestamp wird nicht überprüft, da er dynamisch ist
      });
  });

  it('/company (PUT) - successfully updates a company with owner token', async () => {
    const updateData = {
      companyName: 'Updated Company Name',
      legalForm: 'GmbH',
      revenue: 500000,
      description: 'Updated description of the company',
      location: {
        type: 'Point',
        coordinates: [8.265, 47.349],
      },
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty('companyName', updateData.companyName);
        expect(res.body).toHaveProperty('legalForm', updateData.legalForm);
        expect(res.body).toHaveProperty('revenue', updateData.revenue);
        expect(res.body).toHaveProperty('description', updateData.description);
        // Füge zusätzliche Überprüfungen hinzu, um sicherzustellen, dass alle relevanten Felder aktualisiert wurden
      });
  });

  it('/company (PUT) - successfully updates only the company name', async () => {
    const updateData = {
      companyName: 'New Company Name',
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty('companyName', updateData.companyName);
        // Stelle sicher, dass andere Felder nicht verändert wurden (optional, erfordert vorherige Kenntnis der Daten)
      });
  });

  it('/company (PUT) - successfully updates legal form and description', async () => {
    const updateData = {
      legalForm: 'AG',
      description: 'New description for the company',
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty('legalForm', updateData.legalForm);
        expect(res.body).toHaveProperty('description', updateData.description);
      });
  });

  it('/company (PUT) - successfully updates revenue and number of employees', async () => {
    const updateData = {
      revenue: 1000000,
      numberOfEmployees: 200,
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty('revenue', updateData.revenue);
        expect(res.body).toHaveProperty(
          'numberOfEmployees',
          updateData.numberOfEmployees,
        );
      });
  });

  it('/company (PUT) - fails to update with invalid email', async () => {
    const updateData = {
      contactInformation: 'not-an-email',
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        // Überprüfe, ob die Fehlermeldung entsprechend zurückgegeben wird
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain(
          'each value in contactInformation must be an email',
        );
      });
  });

  it('/company (PUT) - successfully updates contact information with valid email', async () => {
    const updateData = {
      contactInformation: 'valid-email@example.com',
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty(
          'contactInformation',
          updateData.contactInformation,
        );
      });
  });

  it('/company (PUT) - successfully updates location with new coordinates', async () => {
    const updateData = {
      location: {
        type: 'Point',
        coordinates: [9.0, 48.0], // Neue Koordinaten
      },
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.location.coordinates).toEqual(
          updateData.location.coordinates,
        );
      });
  });

  it('/company (PUT) - fails to update with invalid uId', async () => {
    const updateData = {
      uId: 'invalid-uid',
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        // Überprüfe, ob die Fehlermeldung entsprechend zurückgegeben wird
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('The UID is not valid');
      });
  });

  it('/company (PUT) - successfully updates date of establishment', async () => {
    const updateData = {
      dateOfEstablishment: '2024-01-01T00:00:00.000Z', // Neues Datum
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty(
          'dateOfEstablishment',
          updateData.dateOfEstablishment,
        );
      });
  });

  it('/company (PUT) - fails without authentication token', async () => {
    const updateData = {
      companyName: 'Attempted Update Without Token',
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .send(updateData)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', 'Unauthorized');
      });
  });

  it('/company (PUT) - fails with invalid authentication token', async () => {
    const updateData = {
      companyName: 'Attempted Update With Invalid Token',
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer invalid.token.here`)
      .send(updateData)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', 'Unauthorized');
      });
  });

  it('/company (PUT) - fails to update a non-existent company', async () => {
    const updateData = {
      companyName: 'Nonexistent Company Update',
    };
    const nonExistentCompanyId = '5f8d0d55b54764421b7156d9'; // Stelle sicher, dass diese ID nicht in deiner DB existiert

    await request(app.getHttpServer())
      .put(`/company?companyId=${nonExistentCompanyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.NOT_FOUND)
      .expect((res) => {
        expect(res.body).toHaveProperty(
          'message',
          'Company with Id 5f8d0d55b54764421b7156d9 not found.',
        );
      });
  });

  it('/company (PUT) - fails to update with invalid field values', async () => {
    const updateData = {
      revenue: -100, // Negativer Umsatz sollte nicht gültig sein
      numberOfEmployees: -50, // Negative Anzahl von Mitarbeitern sollte nicht gültig sein
    };

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(updateData)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        // Die genaue Fehlermeldung kann variieren, je nachdem, wie deine Validierung implementiert ist
      });
  });

  it('/company (PUT) - fails to update with unauthorized user token', async () => {
    const updateData = {
      companyName: 'Unauthorized Update Attempt',
    };
    const unauthorizedUserToken = userJwtToken; // Nutze einen Token, der einem Benutzer ohne Update-Berechtigungen gehört

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${unauthorizedUserToken}`)
      .send(updateData)
      .expect(HttpStatus.FORBIDDEN)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', 'Forbidden resource');
      });
  });

  it('/company (PUT) - fails to update with unauthorized other Owner token', async () => {
    const updateData = {
      companyName: 'Unauthorized Update Attempt',
    };
    const unauthorizedUserToken = owner2JwtToken; // Nutze einen Token, der einem Benutzer ohne Update-Berechtigungen gehört

    await request(app.getHttpServer())
      .put(`/company?companyId=${companyId}`)
      .set('Authorization', `Bearer ${unauthorizedUserToken}`)
      .send(updateData)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 401);
      });
  });

  it('/company/:id (GET) - success with valid JWT and permissions', async () => {
    const response = await request(app.getHttpServer())
      .get(`/company/${companyId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    const receivedIdAsString = response.body._id.toString();
    const companyIdString = companyId.toString();

    expect(receivedIdAsString).toEqual(companyIdString);

    expect(response.body).toHaveProperty('companyName');
    expect(response.body).toHaveProperty('legalForm');
    expect(response.body).toHaveProperty('industryDetails');
    expect(response.body).toHaveProperty('headquartersAddress');
    expect(response.body).toHaveProperty('managingDirectorCEO');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('contactInformation');
    expect(response.body).toHaveProperty('dateOfEstablishment');
    expect(response.body).toHaveProperty('logoSvg');
    expect(response.body).toHaveProperty('_id');
  });

  it('/company/:id (GET) - success', async () => {
    await request(app.getHttpServer())
      .get(`/company/${companyId}`)
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.OK);
  });

  it('/company/:id (GET) - fail without JWT token', async () => {
    await request(app.getHttpServer())
      .get(`/company/${companyId}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should return the company details for the logged-in user ', async () => {
    // Annahme, dass `ownerJwtToken` dem Benutzer gehört, dessen Unternehmen abgerufen werden soll.
    const response = await request(app.getHttpServer())
      .get('/company/own') // Ersetze `/company/own` durch den tatsächlichen Pfad deines Endpunkts
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('uId');
    expect(response.body).toHaveProperty('ownerAppUserID');
    expect(response.body).toHaveProperty('employeesAppUsersIds');
    expect(response.body).toHaveProperty('companyName');
    expect(response.body).toHaveProperty('legalForm');
    expect(response.body).toHaveProperty('dateOfEstablishment');
    expect(response.body).toHaveProperty('headquartersAddress');
    expect(response.body).toHaveProperty('revenue');
    expect(response.body).toHaveProperty('numberOfEmployees');
    expect(response.body).toHaveProperty('managingDirectorCEO');
    expect(response.body).toHaveProperty('contactInformation');
    expect(response.body).toHaveProperty('location');
    expect(response.body.location).toHaveProperty('type');
    expect(response.body.location).toHaveProperty('coordinates');
    expect(response.body).toHaveProperty('industryDetails');
    expect(response.body.industryDetails).toHaveProperty('parentIndustry');
    expect(response.body.industryDetails).toHaveProperty('childIndustry');
    expect(response.body).toHaveProperty('customerLevels');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
    expect(response.body).toHaveProperty('__v');
    expect(response.body).toHaveProperty('logoSvg');
    expect(response.body).toHaveProperty('description');
  });

  it('should fail for a user without a company', async () => {
    // Annahme, dass `userJwtToken` einem Benutzer gehört, der kein Unternehmen hat.
    await request(app.getHttpServer())
      .get('/company/own') // Ersetze `/company/own` durch den tatsächlichen Pfad deines Endpunkts
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.NOT_FOUND); // Oder einen anderen passenden Statuscode, abhängig von deiner Implementierung.
  });

  it('should fail without JWT token', async () => {
    await request(app.getHttpServer())
      .get('/company/own') // Ersetze `/company/own` durch den tatsächlichen Pfad deines Endpunkts
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should fail with invalid JWT token', async () => {
    await request(app.getHttpServer())
      .get('/company/own') // Ersetze `/company/own` durch den tatsächlichen Pfad deines Endpunkts
      .set('Authorization', `Bearer invalid.token.here`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  afterAll(async () => {
    await clearTestDB();
    //deactivate testmode
    process.env.TESTMODE = 'false';
    await app.close();
  });
});
