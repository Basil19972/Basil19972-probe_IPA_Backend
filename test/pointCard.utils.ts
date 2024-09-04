// business.utils.ts
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export const createBusinessPointCard = async (
  app: INestApplication,
  ownerToken: string,
  cardData: {
    name: string;
    maxpoints: number;
    discount: number;
    description: string;
  },
): Promise<any> => {
  const response = await request(app.getHttpServer())
    .post('/business-point-card')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(cardData);

  return response.body;
};
