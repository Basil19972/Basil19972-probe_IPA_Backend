// customerPointCard.utils.ts
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import mongoose, { model } from 'mongoose';
import {
  CustomerPointCardSchema,
  CustomerPointCard,
} from '../src/customer-point-card/customer-point-card.schema';

const connectToDB = async () => {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    throw new Error('DB_URI ist nicht definiert');
  }
  await mongoose.connect(dbUri);
};

export const createCustomerPointCard = async (
  app: INestApplication,
  userToken: string,
  pointCardID: string,
): Promise<any> => {
  const response = await request(app.getHttpServer())
    .post('/customer-point-card')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ pointCardID })
    .expect(HttpStatus.CREATED);
  return response.body;
};

export const getAllCustomerPointCards = async (
  app: INestApplication,
  userToken: string,
): Promise<any> => {
  const response = await request(app.getHttpServer())
    .get('/customer-point-card')
    .set('Authorization', `Bearer ${userToken}`);
  return response.body;
};

export const updatePointCreatedAtToPast = async (
  customerPointCardId: string,
) => {
  const CustomerPointCardModel = model<CustomerPointCard>(
    'CustomerPointCard',
    CustomerPointCardSchema,
  );

  try {
    await connectToDB(); // Stellen Sie sicher, dass eine Verbindung zur Datenbank besteht

    // Finden Sie die entsprechende CustomerPointCard
    const customerPointCard =
      await CustomerPointCardModel.findById(customerPointCardId);

    if (!customerPointCard) {
      throw new Error('CustomerPointCard nicht gefunden');
    }

    // Setzen Sie das Datum auf 2 Tage in der Vergangenheit
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    // Aktualisieren Sie die createdAt-Werte der ersten 5 Points
    customerPointCard.points.slice(0, 5).forEach((point) => {
      point.createdAt = pastDate;
    });

    // Speichern Sie die Änderungen
    await customerPointCard.save();
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Points:', error);
  } finally {
    await mongoose.connection.close();
  }
};
