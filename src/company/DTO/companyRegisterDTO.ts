import {
  IsNotEmpty,
  IsEmail,
  IsNumber,
  IsArray,
  IsOptional,
  Length,
  Min,
} from 'class-validator';
import { IsSwissUID } from '../../validation/is-swiss-id.validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsSubIndustry } from '../../validation/is-sub-industry.validator';

export class CompanyRegisterDTO {
  @IsSwissUID()
  @IsOptional()
  @ApiProperty()
  uId: string;

  @IsArray()
  @IsOptional()
  @ApiProperty()
  employeesAppUsersIds: string[];

  @IsNotEmpty()
  @ApiProperty()
  companyName: string;

  @ApiProperty()
  @IsOptional()
  legalForm: string;

  @IsOptional()
  @ApiProperty()
  dateOfEstablishment: string;

  @IsOptional()
  @ApiProperty()
  headquartersAddress: string;

  @IsNumber()
  @ApiProperty()
  @IsOptional()
  @Min(0)
  revenue: number;

  @IsNumber()
  @ApiProperty()
  @IsOptional()
  @Min(0)
  numberOfEmployees: number;

  @IsNotEmpty()
  @ApiProperty()
  managingDirectorCEO: string;

  @IsEmail()
  @ApiProperty()
  contactInformation: string;

  @ApiProperty()
  @IsNotEmpty()
  location: {
    type: string;
    coordinates: number[];
  };
  @ApiProperty()
  @IsOptional()
  @Length(20, 500)
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsSubIndustry()
  subIndustry: string;
}
