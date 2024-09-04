import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema()
export class CustomerLevel {
  @Prop({ type: Types.ObjectId, ref: 'AppUser' })
  appUser: Types.ObjectId;

  @Prop()
  totalPoints: number;
}

class Location {
  @Prop({ type: String, enum: ['Point'], required: true })
  type: string;

  @Prop({ type: [Number], required: true }) // [longitude, latitude]
  coordinates: number[];
}

class IndustrySelection {
  @Prop()
  parentIndustry: string;
  @Prop()
  childIndustry: string;
}

@Schema({
  timestamps: true,
})
export class Company extends Document {
  @ApiProperty()
  @Prop()
  uId: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'AppUser' })
  ownerAppUserID: Types.ObjectId;

  @ApiProperty()
  @Prop([{ type: Types.ObjectId, ref: 'AppUser' }])
  employeesAppUsersIds: Types.ObjectId[];

  @ApiProperty()
  @Prop()
  companyName: string;

  @ApiProperty()
  @Prop()
  legalForm: string;

  @ApiProperty()
  @Prop()
  industry: string;

  @ApiProperty()
  @Prop()
  dateOfEstablishment: Date;

  @ApiProperty()
  @Prop()
  headquartersAddress: string;

  @ApiProperty()
  @Prop()
  revenue: number;

  @ApiProperty()
  @Prop()
  numberOfEmployees: number;

  @ApiProperty()
  @Prop()
  managingDirectorCEO: string;

  @ApiProperty()
  @Prop()
  contactInformation: string;

  @ApiProperty()
  @Prop({ type: Location })
  location: Location;

  @ApiProperty()
  @Prop()
  logoSvg: string;

  @ApiProperty()
  @Prop()
  companyColor: string;

  @Prop()
  @ApiProperty()
  description: string;

  @ApiProperty()
  @Prop({ type: IndustrySelection })
  industryDetails: IndustrySelection;

  @ApiProperty()
  @Prop({ type: [CustomerLevel], default: [] })
  customerLevels: CustomerLevel[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ location: '2dsphere' });
