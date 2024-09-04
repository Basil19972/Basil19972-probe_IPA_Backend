import { IsNotEmpty } from 'class-validator';
import { IsObjectId } from '../validation/is-object-id.validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerPointCardDTO {
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  pointCardID: string;
}
