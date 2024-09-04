import { IsNotEmpty, IsString } from 'class-validator';

export class ReceiveTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
