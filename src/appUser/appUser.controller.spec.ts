import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { clearTestDB } from '../../test/database.utils';
import { loginUser, registerOwner, registerUser } from '../../test/user.utils';
import { AppModule } from '../app.module'; // Pfad zu Ihrem AppModule

describe('AppUserController (e2e)', () => {
  let app: INestApplication;
  let userJwtToken: string;
  let userRefreshToken: string;
  let ownerJwtToken: string;
  let employeeId: string;

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
    userRefreshToken = userTokens.refreshToken;
  });

  it('/auth/register (POST) - success for owner', async () => {
    const registerBody = {
      email: 'basil.owner2@example.com',
      name: 'basil',
      password: 'Test1234!',
      termsAccepted: true,
      company: {
        uId: 'CHE-326.103.904',
        employeesAppUsersIds: [],
        companyName: 'Example Company',
        legalForm: 'GmbH',
        dateOfEstablishment: '2023-01-01T00:00:00.000Z',
        headquartersAddress: '123 Example St, City, Country',
        revenue: 1000000,
        numberOfEmployees: 50,
        managingDirectorCEO: 'John Doe',
        contactInformation: 'contact@example.com',
        location: {
          type: 'Point',
          coordinates: [-73.856077, 40.848447],
        },
        subIndustry: 'Restaurants',
      },
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerBody)
      .expect(HttpStatus.CREATED);

    expect(response.body).toBeDefined();
    expect(response.body).toEqual({
      email: 'basil.owner2@example.com',
      name: 'basil',
      password: 'Test1234!',
      company: {
        uId: 'CHE-326.103.904',
        employeesAppUsersIds: [],
        companyName: 'Example Company',
        legalForm: 'GmbH',
        dateOfEstablishment: '2023-01-01T00:00:00.000Z',
        headquartersAddress: '123 Example St, City, Country',
        revenue: 1000000,
        numberOfEmployees: 50,
        managingDirectorCEO: 'John Doe',
        contactInformation: 'contact@example.com',
        location: {
          type: 'Point',
          coordinates: [-73.856077, 40.848447],
        },
        subIndustry: 'Restaurants',
      },
      termsAccepted: true,
    });
  });

  it('/auth/register (POST) - fail with invalid Company UID', async () => {
    const invalidRegisterBody = {
      email: 'new.email@example.com',
      name: 'basil',
      password: 'Test1234!',
      termsAccepted: true,
      company: {
        uId: 'CHE-999.999.999', // Ungültige UID
        employeesAppUsersIds: [],
        companyName: 'Example Company',
        legalForm: 'GmbH',
        dateOfEstablishment: '2023-01-01T00:00:00.000Z',
        headquartersAddress: '123 Example St, City, Country',
        revenue: 1000000,
        numberOfEmployees: 50,
        managingDirectorCEO: 'John Doe',
        contactInformation: 'contact@example.com',
        location: {
          type: 'Point',
          coordinates: [-73.856077, 40.848447],
        },
        subIndustry: 'Restaurants',
      },
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(invalidRegisterBody)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['company.The UID is not valid'],
      timestamp: expect.any(String),
      path: '/auth/register',
    });
  });

  it('/auth/register (POST) - fail with already registered company', async () => {
    // Erster Versuch, die Firma zu registrieren
    const registerBodyFirstTry = {
      email: 'unique.email@example.com',
      name: 'test',
      password: 'Test1234!',
      termsAccepted: true,
      company: {
        uId: 'CHE-469.117.401',
        employeesAppUsersIds: [],
        companyName: 'Example Company',
        legalForm: 'GmbH',
        dateOfEstablishment: '2023-01-01T00:00:00.000Z',
        headquartersAddress: '123 Example St, City, Country',
        revenue: 1000000,
        numberOfEmployees: 50,
        managingDirectorCEO: 'John Doe',
        contactInformation: 'contact@example.com',
        location: {
          type: 'Point',
          coordinates: [-73.856077, 40.848447],
        },
        subIndustry: 'Restaurants',
      },
    };

    // Senden Sie die erste Registrierungsanfrage
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerBodyFirstTry)
      .expect(HttpStatus.CREATED);

    // Zweiter Versuch, dieselbe Firma zu registrieren, aber mit einer anderen E-Mail
    const registerBodySecondTry = {
      email: 'another.unique.email@example.com',
      name: 'test',
      password: 'Test1234!',
      termsAccepted: true,

      company: {
        uId: 'CHE-469.117.401', // Gleiche UID wie beim ersten Versuch
        employeesAppUsersIds: [],
        companyName: 'Example Company',
        legalForm: 'GmbH',
        dateOfEstablishment: '2023-01-01T00:00:00.000Z',
        headquartersAddress: '123 Example St, City, Country',
        revenue: 1000000,
        numberOfEmployees: 50,
        managingDirectorCEO: 'John Doe',
        contactInformation: 'contact@example.com',
        location: {
          type: 'Point',
          coordinates: [-73.856077, 40.848447],
        },
        subIndustry: 'Restaurants',
      },
    };

    // Senden Sie die zweite Registrierungsanfrage und erwarten Sie einen Fehler
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerBodySecondTry)
      .expect(HttpStatus.BAD_REQUEST);

    // Überprüfen Sie die Antwort
    expect(response.body).toEqual({
      statusCode: 400,
      message:
        'The company with the UID CHE-469.117.401 is already registered.',
      timestamp: expect.any(String),
      path: '/auth/register',
    });
  });

  it('/auth/register (POST) - fail with wrong industry enum', async () => {
    const registerBodyWrongIndustryEnum = {
      email: 'unique.email2@example.com',
      password: 'Test1234!',
      company: {
        uId: 'CHE-407.499.849',
        employeesAppUsersIds: [],
        companyName: 'Example Company',
        legalForm: 'GmbH',
        dateOfEstablishment: '2023-01-01T00:00:00.000Z',
        headquartersAddress: '123 Example St, City, Country',
        revenue: 1000000,
        numberOfEmployees: 50,
        managingDirectorCEO: 'John Doe',
        contactInformation: 'contact@example.com',
        location: {
          type: 'Point',
          coordinates: [-73.856077, 40.848447],
        },
        subIndustry: 'Restaurantssss',
      },
    };
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerBodyWrongIndustryEnum)
      .expect(HttpStatus.BAD_REQUEST); // Erwarten Sie einen Fehlerstatus, z.B. 400 Bad Request

    // Überprüfen Sie, ob die Fehlermeldung korrekt ist
    expect(response.body.message).toContain(
      'company.subIndustry must be a valid sub-industry',
    );
  });

  it('/auth/register (POST) - fail with existing email', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'basil.peter@hotmail.ch',
      name: 'basil',
      password: 'Test1234!',
      termsAccepted: true,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'basil.peter@hotmail.ch',
        name: 'basil',
        password: 'Test1234!',
        termsAccepted: true,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message:
        'The email address basil.peter@hotmail.ch is already registered.',
      timestamp: expect.any(String),
      path: '/auth/register',
    });
  });

  it('/auth/register (POST) - fail with invalid email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'invalidemail',
        name: 'basil',
        password: 'Test1234!',
        termsAccepted: true,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['email must be an email'],
      timestamp: expect.any(String),
      path: '/auth/register',
    });
  });

  it('/auth/login (POST) - success', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'basil.peter@hotmail.ch',
        password: 'Test1234!',
      })
      .expect(HttpStatus.CREATED);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('/auth/login (POST) - fail with invalid email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'invalidemail',
        password: 'Test1234!',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['email must be an email'],
      timestamp: expect.any(String),
      path: '/auth/login',
    });
  });

  it('/auth/login (POST) - fail with invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'basil.peter@hotmail.ch',
        password: 'WrongPassword',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'Invalid credentials.',
      timestamp: expect.any(String),
      path: '/auth/login',
    });
  });

  it('/auth (PUT) - updates user successfully', async () => {
    const response = await request(app.getHttpServer())
      .put('/auth')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({
        name: 'new name',
      })
      .expect(HttpStatus.OK);

    expect(response.body.name).toEqual('new name');
  });

  it('/principal (GET) - success with valid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/principal')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('roles');
    expect(response.body.roles).toContain('User');
    expect(response.body).toHaveProperty('businessPointCards');
    expect(Array.isArray(response.body.businessPointCards)).toBeTruthy();
    expect(response.body).toHaveProperty('customerPointCards');
    expect(Array.isArray(response.body.customerPointCards)).toBeTruthy();
  });

  it('/principal (GET) - success with valid owner token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/principal')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('roles');
    expect(response.body).toHaveProperty('company');
    expect(response.body.roles).toContain('Owner');
  });

  it('/auth/logout (POST) - success with valid token', async () => {
    const accessTokenCookie = `accessToken=${userJwtToken}; Path=/; HttpOnly`;
    const refreshTokenCookie = `refreshToken=${userRefreshToken}; Path=/; HttpOnly`;
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', [accessTokenCookie, refreshTokenCookie]) // Setzen der Cookies
      .expect(HttpStatus.CREATED);
  });

  it('/auth/logout (POST) - fail with invalid token', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', 'Bearer invalid_token')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/auth/logout (POST) - fail without token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
      timestamp: expect.any(String),
      path: '/auth/logout',
    });
  });

  it('/auth/password (PUT) - fail with incorrect password', async () => {
    await request(app.getHttpServer())
      .put('/auth/password')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({
        password: 'WrongPassword123!',
        newPassword: 'ChangedPassword123!',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/auth/password (PUT) - success with correct password', async () => {
    await request(app.getHttpServer())
      .put('/auth/password')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({
        password: 'Test1234!',
        newPassword: 'ChangedPassword123!',
      })
      .expect(HttpStatus.NO_CONTENT);
  });

  it('/auth/forgotPassword (POST) - success with registered email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgotPassword')
      .send({ email: 'basil.peter@hotmaill.ch' }) // Bewusst falsch weil sonst email gesendet wird
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      message:
        'If the email address is in our database, we have sent an email with instructions to reset your password.',
    });
  });

  it('/auth/forgotPassword (POST) - fail with unregistered email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgotPassword')
      .send({ email: 'unregistered@example.com' })
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      message:
        'If the email address is in our database, we have sent an email with instructions to reset your password.',
    });
  });

  it('/auth/forgotPassword (POST) - fail with invalid email format', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgotPassword')
      .send({ email: 'invalid-email' })
      .expect(HttpStatus.BAD_REQUEST);

    // Überprüfen Sie die Antwort auf die erwartete Fehlermeldung
    expect(response.body).toEqual({
      statusCode: 400,
      message: ['email must be an email'],
      timestamp: expect.any(String),
      path: '/auth/forgotPassword',
    });
  });

  it('/auth/resetPassword (POST) - fail with invalid token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/resetPassword')
      .send({ password: 'NewPassword123!', token: 'invalid-token' })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    // Überprüfen Sie die Antwort auf die erwartete Fehlermeldung
    expect(response.body).toEqual({
      statusCode: 500,
      message: 'jwt malformed',
      timestamp: expect.any(String),
      path: '/auth/resetPassword',
    });
  });

  it('/addEmployee (POST) - success with valid data', async () => {
    // Zuerst holen Sie die Company ID des Owners
    const principalResponse = await request(app.getHttpServer())
      .get('/auth/principal')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    const companyId = principalResponse.body.company;

    expect(companyId).toBeDefined();

    const addEmployeeBody = {
      email: 'basil.new@hotmail.ch',
      password: 'Test1234!',
      companyId: companyId,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/addEmployee')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(addEmployeeBody)
      .expect(HttpStatus.CREATED);

    employeeId = response.body._id;

    // Überprüfen Sie die Antwort
    expect(response.body).toBeDefined();
    expect(response.body.email).toEqual('basil.new@hotmail.ch');
    expect(response.body).toHaveProperty('roles');
    expect(response.body).toHaveProperty('businessPointCards');
    expect(response.body).toHaveProperty('customerPointCards');
    expect(response.body).toHaveProperty('employee');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('/addEmployee (POST) - fail with missing required fields', async () => {
    const addEmployeeBody = {
      password: 'test1234!',
      companyId: 'irgendeineCompanyId',
    };

    await request(app.getHttpServer())
      .post('/auth/addEmployee')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(addEmployeeBody)
      .expect(HttpStatus.BAD_REQUEST);
  });

  // Test mit ungültigen Datenformaten
  it('/addEmployee (POST) - fail with invalid email format', async () => {
    const addEmployeeBody = {
      email: 'ungültigeEmail',
      password: 'test1234!',
      companyId: 'irgendeineCompanyId',
    };

    await request(app.getHttpServer())
      .post('/auth/addEmployee')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(addEmployeeBody)
      .expect(HttpStatus.BAD_REQUEST); // Erwarten Sie einen 400 Bad Request Status
  });

  it('/addEmployee (POST) - fail with invalid company ObjectId', async () => {
    const addEmployeeBody = {
      email: 'test2@example.com',
      password: 'Test1234!',
      companyId: '6577558ef8ad5d7fc316f20w',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/addEmployee')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(addEmployeeBody)
      .expect(HttpStatus.BAD_REQUEST); // Erwarten Sie einen 400 Bad Request Status

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['companyId is an invalid ObjectId'], // Angepasste Nachricht entsprechend der tatsächlichen Antwort
      timestamp: expect.any(String), // Da der Timestamp dynamisch ist, verwenden Sie expect.any(String)
      path: '/auth/addEmployee',
    });
  });

  it('/addEmployee (POST) - fail without valid token', async () => {
    const addEmployeeBody = {
      email: 'test@example.com',
      password: 'test1234!',
      companyId: 'irgendeineCompanyId',
    };

    await request(app.getHttpServer())
      .post('/auth/addEmployee')
      .send(addEmployeeBody)
      .expect(HttpStatus.UNAUTHORIZED); // Erwarten Sie einen 401 Unauthorized Status
  });

  it('/addEmployee (POST) - fail with duplicate email', async () => {
    // Versuchen Sie dann, denselben Mitarbeiter noch einmal hinzuzufügen
    const addEmployeeBody = {
      email: 'basil.peter@hotmail.ch',
      password: 'test1234!',
      companyId: 'irgendeineCompanyId',
    };

    await request(app.getHttpServer())
      .post('/auth/addEmployee')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(addEmployeeBody)
      .expect(HttpStatus.BAD_REQUEST); // Erwarten Sie einen 400 Bad Request Status
  });

  // Test mit ungültigem Token
  it('/addEmployeeViaToken (POST) - fail with invalid token', async () => {
    const addEmployeeViaTokenBody = {
      token: 'ungültigerOderAbgelaufenerToken',
    };

    await request(app.getHttpServer())
      .post('/auth/addEmployeeViaToken')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send(addEmployeeViaTokenBody)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR); // Erwarten Sie einen 400 Bad Request Status
  });

  // Test ohne Token
  it('/addEmployeeViaToken (POST) - fail without token', async () => {
    await request(app.getHttpServer())
      .post('/auth/addEmployeeViaToken')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .send({})
      .expect(HttpStatus.BAD_REQUEST); // Erwarten Sie einen 400 Bad Request Status
  });

  // Test mit nicht autorisiertem Zugriff
  it('/addEmployeeViaToken (POST) - fail without valid token', async () => {
    const addEmployeeViaTokenBody = {
      token: 'irgendeinToken',
    };

    await request(app.getHttpServer())
      .post('/auth/addEmployeeViaToken')
      .send(addEmployeeViaTokenBody)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR); // Erwarten Sie einen 401 Unauthorized Status
  });

  it('/employees (GET) - success with valid token and owner role', async () => {
    // Hier nehmen wir an, dass der angemeldete Benutzer die Rolle "Besitzer" hat und Mitarbeiter abrufen kann.
    await request(app.getHttpServer())
      .get('/auth/employees')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);
  });

  it('/employees (GET) - fail without valid token', async () => {
    await request(app.getHttpServer())
      .get('/auth/employees')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  // Positiver Test für das Entfernen eines Mitarbeiters mit gültigen Daten
  it('/removeEmployee (DELETE) - success with valid data', async () => {
    // Hier setzen wir voraus, dass employeeId bereits definiert und gültig ist
    const response = await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${employeeId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.OK);

    // Überprüfen Sie die Antwort (es wird kein Body erwartet)
    expect(response.body).toEqual({});
  });

  // Negativer Test für das Entfernen eines Mitarbeiters ohne Authorization-Header
  it('/removeEmployee (DELETE) - fail without Authorization header', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${employeeId}`)
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
      timestamp: expect.any(String),
      path: `/auth/removeEmployee?employeeId=${employeeId}`,
    });
  });

  // Negativer Test für das Entfernen eines Mitarbeiters mit ungültigem Token
  it('/removeEmployee (DELETE) - fail with an invalid token', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${employeeId}`)
      .set('Authorization', `Bearer invalid_token_here`)
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
      timestamp: expect.any(String),
      path: `/auth/removeEmployee?employeeId=${employeeId}`,
    });
  });

  // Negativer Test für das Entfernen eines Mitarbeiters ohne employeeId
  it('/removeEmployee (DELETE) - fail without employeeId', async () => {
    const response = await request(app.getHttpServer())
      .delete('/auth/removeEmployee')
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.NOT_FOUND);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'User with ID undefined not found.',
      timestamp: expect.any(String),
      path: `/auth/removeEmployee`,
    });
  });

  // Negativer Test für das Entfernen eines nicht existierenden Mitarbeiters
  it('/removeEmployee (DELETE) - fail for a non-existent employeeId', async () => {
    const nonExistentEmployeeId = '65f2f9f8fa2bab301592e09c';
    const response = await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${nonExistentEmployeeId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.NOT_FOUND);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'User with ID 65f2f9f8fa2bab301592e09c not found.',
      timestamp: expect.any(String),
      path: `/auth/removeEmployee?employeeId=${nonExistentEmployeeId}`,
    });
  });

  // Negativer Test für das Entfernen eines Mitarbeiters durch einen Benutzer mit unzureichenden Berechtigungen
  it('/removeEmployee (DELETE) - fail for a user with insufficient permissions', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${employeeId}`)
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.FORBIDDEN);

    expect(response.body).toEqual({
      statusCode: 403,
      message: 'Forbidden resource',
      timestamp: expect.any(String),
      path: `/auth/removeEmployee?employeeId=${employeeId}`,
    });
  });

  it('should fail without Authorization header', async () => {
    await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${employeeId}`)
      .expect(HttpStatus.UNAUTHORIZED); // Oder den spezifischen Statuscode, den dein AuthGuard zurückgibt
  });

  it('should fail with an invalid token', async () => {
    await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${employeeId}`)
      .set('Authorization', `Bearer invalid_token_here`)
      .expect(HttpStatus.UNAUTHORIZED); // Oder den spezifischen Statuscode für ungültige Token
  });

  it.skip('should fail without employeeId', async () => {
    await request(app.getHttpServer())
      .delete(`/auth/removeEmployee`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.NOT_FOUND); // Annahme: Dein Server validiert erforderliche Parameter
  });

  it('should fail for a non-existent employeeId', async () => {
    const nonExistentEmployeeId = '65f2f9f8fa2bab301592e09c';
    await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${nonExistentEmployeeId}`)
      .set('Authorization', `Bearer ${ownerJwtToken}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should fail for a user with insufficient permissions', async () => {
    // Annahme: `restrictedJwtToken` gehört zu einem Benutzer mit eingeschränkten Berechtigungen
    await request(app.getHttpServer())
      .delete(`/auth/removeEmployee?employeeId=${employeeId}`)
      .set('Authorization', `Bearer ${userJwtToken}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('/auth/verifyMailViaToken (POST) - fail with invalid token', async () => {
    const invalidToken = 'invalid_token_example';

    const response = await request(app.getHttpServer())
      .post('/auth/verifyMailViaToken')
      .send({ token: invalidToken })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(response.body).toEqual({
      statusCode: 500,
      message: 'jwt malformed',
      timestamp: expect.any(String),
      path: '/auth/verifyMailViaToken',
    });
  });

  it('/auth/verifyMailViaToken (POST) - fail with missing token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/verifyMailViaToken')
      .send({})
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['token should not be empty'],
      timestamp: expect.any(String),
      path: '/auth/verifyMailViaToken',
    });
  });

  it('/auth/updateUserEmail (PUT) - updates email successfully', async () => {
    const newEmail = 'updateduser@example.com';
    const response = await request(app.getHttpServer())
      .put('/auth/updateUserEmail')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({ email: newEmail })
      .expect(HttpStatus.OK);

    expect(response.body.email).toEqual(newEmail);
  });

  it('/auth/updateUserEmail (PUT) - fails with invalid email', async () => {
    const invalidEmail = 'invalidemail';
    const response = await request(app.getHttpServer())
      .put('/auth/updateUserEmail')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({ email: invalidEmail })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.message).toContain('email must be an email');
  });

  it('/auth (PUT) - fails because email is already in use', async () => {
    const response = await request(app.getHttpServer())
      .put('/auth/updateUserEmail')
      .set('Authorization', `Bearer ${userJwtToken}`)
      .send({
        email: 'basil.owner2@example.com',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.message).toEqual(
      'The email address basil.owner2@example.com is already registered.',
    );
  });

  afterAll(async () => {
    await clearTestDB();
    //deactivate testmode
    process.env.TESTMODE = 'false';
    await app.close();
  });
});
