import { HttpStatus, INestApplication } from '@nestjs/common';
import mongoose from 'mongoose';
import * as request from 'supertest';
import { CompanySchema } from '../src/company/compnay.schema';

// Funktion zum systematischen Generieren von Koordinaten
function generateCoordinatesForCompany(
  index: number,
  baseLongitude: number,
  baseLatitude: number,
) {
  // Schrittweite für die Koordinaten, um die Entfernungen zu variieren
  const stepSize = 0.001; // Ca. 111 Meter Schrittweite
  return [baseLongitude + index * stepSize, baseLatitude + index * stepSize];
}

// Funktion zum Registrieren von Benutzern und Unternehmen
export const registerUsersAndCompanies = async (app: INestApplication) => {
  for (let i = 0; i < 30; i++) {
    const email = `test${i}.tes@test.com`;
    const password = 'Test1234!';
    // Generiere Koordinaten mit zunehmender Entfernung
    const [longitude, latitude] = generateCoordinatesForCompany(
      i,
      8.265,
      47.349,
    );

    const registrationData = {
      email: email,
      name: 'Test User',
      password: password,
      termsAccepted: true,

      company: {
        companyName: `Test Company ${i}`,
        headquartersAddress: 'Sportweg 15, 5610 Wohlen, Switzerland',
        managingDirectorCEO: `Test CEO ${i}`,
        contactInformation: `contact${i}@example.com`,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        subIndustry: 'Restaurants',
      },
    };

    try {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registrationData)
        .expect(HttpStatus.CREATED);
    } catch (error) {
      console.error(
        `Error registering User and Company ${i}:`,
        error.response?.body || error.message,
      );
    }
  }
};

const connectToDB = async () => {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    throw new Error('DB_URI ist nicht definiert');
  }
  await mongoose.connect(dbUri);
};

export const findCompanyByName = async (companyName: string) => {
  await connectToDB();

  // Stelle sicher, dass 'Company' korrekt auf dein tatsächliches Company-Schema verweist
  const CompanyModel = mongoose.model('Company', CompanySchema);

  try {
    const company = await CompanyModel.findOne({
      companyName: companyName,
    }).exec();

    if (!company) {
      console.log(`Keine Firma mit dem Namen ${companyName} gefunden.`);
      return null;
    }

    return company;
  } catch (error) {
    console.error('Fehler beim Suchen der Firma:', error);
    return null;
  } finally {
    await mongoose.connection.close();
  }
};
