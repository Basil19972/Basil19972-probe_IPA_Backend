import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class OfferTokenDTO {
  @ApiProperty()
  @IsNotEmpty()
  token: string;
}
