// qrCode.utils.ts
import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';

export const generateQRCode = async (
  app: INestApplication,
  userToken: string,
  businessPointCardID: string,
): Promise<any> => {
  await request(app.getHttpServer())
    .post('/qrcode/generate')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      points: 2,
      businessPointCardID,
    });
};

export const generateQRCode10points = async (
  app: INestApplication,
  userToken: string,
  businessPointCardID: string,
): Promise<any> => {
  const response = await request(app.getHttpServer())
    .post('/qrcode/generate')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      points: 10,
      businessPointCardID,
    });

  // Extrahieren des Tokens aus der JSON-Antwort
  const jwtToken = response.body.token;

  return jwtToken;
};

export const receiveQRCode = async (
  app: INestApplication,
  userJwtToken: string,
  qrCodeToken: string,
): Promise<any> => {
  const response = await request(app.getHttpServer())
    .post('/qrcode/receive') // Change to POST and new URL
    .send({ token: qrCodeToken }) // Send token in the body
    .set('Authorization', `Bearer ${userJwtToken}`)
    .expect(HttpStatus.CREATED);

  return response.body;
};
