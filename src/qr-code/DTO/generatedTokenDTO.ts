import { ApiProperty } from '@nestjs/swagger';

export class GeneratedTokenDTO {
  @ApiProperty()
  token: string;
}
