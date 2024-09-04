// DTO
import { Expose, Transform } from 'class-transformer';
import {} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../role.enum';
import { Types } from 'mongoose';
import { Employee } from '../appUser.schema';

export class SuccessAddEmployeeResponseDTO {
  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ enum: UserRole, isArray: true })
  @Expose()
  roles: UserRole[];

  @ApiProperty()
  @Expose()
  @Transform((params) => params.obj._id)
  company: Types.ObjectId;

  @ApiProperty()
  @Expose()
  businessPointCards: Types.ObjectId[];

  @ApiProperty()
  @Expose()
  customerPointCards: Types.ObjectId[];

  @ApiProperty()
  @Expose()
  employee: Types.DocumentArray<Employee>;
}
