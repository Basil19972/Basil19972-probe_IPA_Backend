import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ContactDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(100)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  message: string;
}
