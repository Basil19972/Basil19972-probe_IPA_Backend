// DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateEmailDTO {
  @IsEmail()
  @ApiProperty()
  @IsNotEmpty()
  email: string;
}
