// DTO
import { IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppUserLoginDTO {
  @IsOptional()
  @IsEmail()
  @ApiProperty()
  email: string;
  @IsOptional()
  @ApiProperty()
  password: string;
}
