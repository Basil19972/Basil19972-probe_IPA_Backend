import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { IsNumberRange } from '../../validation/is-range-of-numbers';

export class CreateOfferDto {
  @ApiProperty()
  @IsNotEmpty()
  @Length(5, 500)
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(5, 500)
  productName: string;

  @ApiProperty()
  @Length(5, 500)
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  discount: number;

  @IsOptional()
  @ApiProperty()
  @IsNumberRange()
  customerLevelRange: [number];

  @IsOptional()
  @ApiProperty()
  amountOfScans: number;

  @ApiProperty()
  @IsNotEmpty()
  startDate: Date;
}
