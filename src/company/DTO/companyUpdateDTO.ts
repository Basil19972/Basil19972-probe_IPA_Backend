import { IsEmail, IsNumber, IsOptional, Length, Min } from 'class-validator';
import { IsSwissUID } from '../../validation/is-swiss-id.validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsSubIndustry } from '../../validation/is-sub-industry.validator';
export class CompanyUpdateDTO {
  @IsSwissUID()
  @IsOptional()
  @ApiPropertyOptional()
  uId?: string;

  @IsOptional()
  @ApiPropertyOptional()
  companyName?: string;

  @IsOptional()
  @ApiPropertyOptional()
  legalForm?: string;

  @IsOptional()
  @ApiPropertyOptional()
  companyColor?: string;

  @IsOptional()
  @ApiPropertyOptional()
  dateOfEstablishment?: string;

  @IsOptional()
  @ApiPropertyOptional()
  headquartersAddress?: string;

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Min(0)
  revenue?: number;

  @IsNumber({}, { each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Min(0)
  numberOfEmployees?: number;

  @IsOptional()
  @ApiPropertyOptional()
  managingDirectorCEO?: string;

  @IsEmail({}, { each: true })
  @IsOptional()
  @ApiPropertyOptional()
  contactInformation?: string;

  @IsOptional()
  @ApiPropertyOptional()
  location?: {
    type?: string;
    coordinates?: number[];
  };

  @IsOptional()
  @Length(20, 500)
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsSubIndustry()
  @ApiPropertyOptional()
  subIndustry?: string;
}
