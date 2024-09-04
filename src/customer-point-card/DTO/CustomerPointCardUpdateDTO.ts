import { CustomerPointCard } from '../customer-point-card.schema';

export class CustomerPointCardUpdateDto {
  updatedCard: CustomerPointCard;
  newCards: CustomerPointCard[];
}
