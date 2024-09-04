import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Max } from 'class-validator';

export class QRCodeDTO {
  @Max(20)
  @IsNotEmpty()
  @ApiProperty()
  points: number;

  @IsNotEmpty()
  @ApiProperty()
  businessPointCardID: string;
}
