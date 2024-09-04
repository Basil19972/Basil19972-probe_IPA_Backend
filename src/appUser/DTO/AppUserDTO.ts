import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';
import { CompanyRegisterDTO } from '../../company/DTO/companyRegisterDTO';
import { IsStrongPassword } from '../../validation/is-strong-password';

export class AppUserDTO {
  @Length(2, 50)
  @ApiProperty()
  name: string;

  @IsEmail()
  @ApiProperty()
  email: string;

  @IsStrongPassword()
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyRegisterDTO)
  @ApiProperty()
  company: CompanyRegisterDTO;

  @ApiProperty()
  @IsNotEmpty()
  termsAccepted: boolean;
}
