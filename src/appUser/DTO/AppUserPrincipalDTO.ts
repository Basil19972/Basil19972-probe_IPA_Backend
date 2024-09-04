import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { Employee } from '../appUser.schema';

export class AppUserPrincipalDTO {
  @Expose()
  @ApiProperty()
  id: Types.ObjectId;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  roles: string[];

  @Expose()
  @ApiProperty()
  company: Types.ObjectId;

  @Expose()
  @ApiProperty()
  @Transform((value) => value.obj.businessPointCards.map((id) => id.toString()))
  businessPointCards: Types.ObjectId[];

  @Expose()
  @ApiProperty()
  @Transform((value) => value.obj.customerPointCards.map((id) => id.toString()))
  customerPointCards: Types.ObjectId[];

  @Expose()
  @ApiProperty()
  @Transform((value) => value.obj.employee.map((id) => id.toString()))
  employee: Types.DocumentArray<Employee>;
}
