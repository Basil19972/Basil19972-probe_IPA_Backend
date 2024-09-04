// DTO
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional } from 'class-validator';

export class BusinessPointCardUpdateDTO {
  @IsString()
  @Length(3, 50)
  @ApiProperty()
  @IsOptional()
  readonly name: string;

  @ApiProperty()
  @Length(20, 500)
  @IsOptional()
  description: string;
}
