// get-companies-in-radius.dto.ts
import { Type } from 'class-transformer';
import { IsNumber, Min, IsOptional, Max } from 'class-validator';

export class GetCompaniesNearByDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  longitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  pageSize: number = 10;
}
