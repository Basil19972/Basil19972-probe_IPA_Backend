// DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AddEmployeeViaTokenDTO {
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}
