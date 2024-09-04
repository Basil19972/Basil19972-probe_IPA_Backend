// DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsNotEmpty } from 'class-validator';
import { IsObjectId } from '../../validation/is-object-id.validator';
import { IsStrongPassword } from '../../validation/is-strong-password';

export class AddEmployeesAppUserDTO {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsOptional()
  @ApiProperty()
  @IsStrongPassword()
  password: string;

  @IsNotEmpty()
  @IsObjectId()
  companyId: string;
}
