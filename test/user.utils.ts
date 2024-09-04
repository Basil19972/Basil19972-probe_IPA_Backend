// auth.utils.ts
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import mongoose, { model } from 'mongoose';
import { AppUser, AuthSchema } from '../src/appUser/appUser.schema';

const connectToDB = async () => {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    throw new Error('DB_URI ist nicht definiert');
  }
  await mongoose.connect(dbUri);
};

const userRegistrationData = {
  email: 'test@example.com',
  name: 'test',
  password: 'Test1234!',
  termsAccepted: true,
};

const ownerRegistrationData = {
  email: 'basil.owner@example.com',
  name: 'basil',
  password: 'Test1234!',
  termsAccepted: true,
  company: {
    uId: 'CHE-114.369.245',
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

const ownerRegistrationData2 = {
  email: 'basil.owner2@example.com',
  name: 'basil',
  password: 'Test1234!',
  termsAccepted: true,
  company: {
    uId: 'CHE-355.839.249',
    employeesAppUsersIds: [],
    companyName: 'Second Company',
    legalForm: 'GmbH',
    dateOfEstablishment: '2023-01-01T00:00:00.000Z',
    headquartersAddress: '123 Example St, City, Country',
    revenue: 1000000,
    numberOfEmployees: 50,
    managingDirectorCEO: 'John Doe',
    contactInformation: 'contact@example.com',
    location: {
      type: 'Point',
      coordinates: [-73.864687, 40.841937],
    },
    subIndustry: 'Restaurants',
  },
};
export const registerUser = async (app: INestApplication) => {
  await request(app.getHttpServer())
    .post('/auth/register')
    .send(userRegistrationData)
    .expect(HttpStatus.CREATED);
};

export const registerOwner = async (app: INestApplication) => {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send(ownerRegistrationData)
    .expect(HttpStatus.CREATED);

  return response.body;
};

export const registerOwner2 = async (app: INestApplication) => {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send(ownerRegistrationData2)
    .expect(HttpStatus.CREATED);
  return response.body;
};

export const loginUser = async (
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
  };
};

export const registerEmployee = async (
  app: INestApplication,
  companyId: string,
  accessToken: string,
) => {
  const employeeRegistrationData = {
    email: 'basil3.test@test.com',
    password: 'Test1234!',
    companyId: companyId,
  };

  await request(app.getHttpServer())
    .post('/auth/addEmployee')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(employeeRegistrationData)
    .expect(HttpStatus.CREATED);
};

export const getPrincipalUser = async (
  app: INestApplication,
  accessToken: string,
): Promise<any> => {
  const response = await request(app.getHttpServer())
    .get('/auth/principal')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(HttpStatus.OK);

  return response.body;
};

export const updateRole = async (userEmail, newRole) => {
  const AuthModel = model<AppUser>('AppUser', AuthSchema);

  try {
    await connectToDB();

    const user = await AuthModel.findOne({ email: userEmail });
    if (!user) {
      throw new Error('Benutzer nicht gefunden');
    }

    user.roles = [newRole]; // Setzen Sie die neue Rolle. Passen Sie dies entsprechend an, falls Sie mehrere Rollen unterstützen möchten.
    await user.save();
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Rolle:', error);
  } finally {
    await mongoose.connection.close();
  }
};
