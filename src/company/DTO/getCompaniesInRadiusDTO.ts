import { Type } from 'class-transformer';
import { IsNumber, Min, Max } from 'class-validator';

export class GetCompaniesInRadiusDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius: number;
}
