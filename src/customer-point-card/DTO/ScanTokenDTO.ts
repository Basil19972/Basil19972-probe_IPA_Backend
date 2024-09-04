// DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ScanTokenDTO {
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}
