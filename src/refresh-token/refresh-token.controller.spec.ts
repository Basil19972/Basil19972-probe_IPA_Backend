import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { clearTestDB } from '../../test/database.utils';
import * as request from 'supertest';
import { loginUser, registerOwner, registerUser } from '../../test/user.utils';

describe('RefreshTokenController (e2e)', () => {
  let app: INestApplication;

  let originalUserRefreshToken: string;
  let originalOwnerRefreshToken: string;

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

    originalUserRefreshToken = userTokens.refreshToken;
    originalOwnerRefreshToken = ownerTokens.refreshToken;
  });

  it('/refresh-token (POST) - should refresh token successfully for user', async () => {
    const response = await request(app.getHttpServer())
      .post('/refresh-token')
      .send({ refreshToken: originalUserRefreshToken })
      .expect(HttpStatus.CREATED);

    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');

    // Überprüfen des Access-Tokens
    const decodedAccessToken = response.body.accessToken;
    expect(decodedAccessToken).not.toBeNull();

    // Vergleichen der Refresh-Tokens
    expect(response.body.refreshToken).toEqual(originalUserRefreshToken);
  });

  it('/refresh-token (POST) - should refresh token successfully for owner', async () => {
    const response = await request(app.getHttpServer())
      .post('/refresh-token')
      .send({ refreshToken: originalOwnerRefreshToken })
      .expect(HttpStatus.CREATED);

    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');

    // Überprüfen des Access-Tokens
    const decodedAccessToken = response.body.accessToken;
    expect(decodedAccessToken).not.toBeNull();

    // Vergleichen der Refresh-Tokens
    expect(response.body.refreshToken).toEqual(originalOwnerRefreshToken);
  });

  it('/refresh-token (POST) - should fail without refreshToken in body', async () => {
    await request(app.getHttpServer())
      .post('/refresh-token')
      .send({})
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  it('/refresh-token (POST) - should fail with expired refresh token', async () => {
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1NjhjNDUwM2VkZmYwOTdkNjI3NzY2YiIsImlhdCI6MTcwMTM2NDgyMSwiZXhwIjoxNzAxMzY0ODMxfQ.DNFsjdOf56txz1yIJLe0PQghGFAGoXTEids4f7NwB94';
    await request(app.getHttpServer())
      .post('/refresh-token')
      .send({ refreshToken: expiredToken })
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  it('/refresh-token (POST) - should fail with manipulated refresh token', async () => {
    const manipulatedToken = originalUserRefreshToken.slice(0, -1) + 'X'; // Einfache Manipulation des Tokens
    await request(app.getHttpServer())
      .post('/refresh-token')
      .send({ refreshToken: manipulatedToken })
      .expect(HttpStatus.UNAUTHORIZED); // Erwartet 401 Unauthorized
  });

  afterAll(async () => {
    await clearTestDB();

    //deactivate testmode
    process.env.TESTMODE = 'false';
    await app.close();
  });
});
