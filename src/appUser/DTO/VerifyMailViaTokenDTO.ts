// DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class VerifyMailViaTokenDTO {
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}
