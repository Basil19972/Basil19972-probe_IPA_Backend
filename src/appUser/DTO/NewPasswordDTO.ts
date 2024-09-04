// DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsStrongPassword } from '../../validation/is-strong-password';

export class NewPasswordDTO {
  @IsNotEmpty()
  @IsStrongPassword()
  @ApiProperty()
  password: string;

  @IsNotEmpty()
  @ApiProperty()
  token: string;
}
