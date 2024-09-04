// DTO
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UpdatedEmployeesInCompanyDTO {
  @Expose()
  @ApiProperty()
  _id: string;

  @Expose()
  @ApiProperty()
  companyName: string;

  @Expose()
  @ApiProperty()
  employeesAppUsersIds: string[];

  @Expose()
  @ApiProperty()
  contactInformation: string;

  @Expose()
  @ApiProperty()
  headquartersAddress: string;
}
