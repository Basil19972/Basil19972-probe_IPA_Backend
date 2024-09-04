import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsStrongPassword } from '../../validation/is-strong-password';

export class ChangePasswordDTO {
  @IsNotEmpty()
  @ApiProperty()
  @IsStrongPassword()
  password: string;

  @IsStrongPassword()
  @IsNotEmpty()
  @ApiProperty()
  newPassword: string;
}
