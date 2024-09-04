// DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class PasswordForgotDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}
