// DTO
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Length,
  Min,
  Max,
} from 'class-validator';
import { IsSpecificDiscount } from '../../validation/is-specific-discount.validator';

export class BusinessPointCardDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @ApiProperty()
  readonly name: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  @ApiProperty()
  readonly maxpoints: number;

  @ApiProperty()
  @IsSpecificDiscount()
  readonly discount: number;

  @ApiProperty()
  @Length(20, 500)
  description: string;
}
