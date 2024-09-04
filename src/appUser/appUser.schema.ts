import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length, MaxLength } from 'class-validator';
import { Document, Types } from 'mongoose';
import { UserRole } from './role.enum';

@Schema({ timestamps: true })
export class Employee {
  @Prop({ type: Types.ObjectId, ref: 'Company' })
  companyId: Types.ObjectId;

  @Prop()
  isVerified: boolean;
}
export const EmployeeSchema = SchemaFactory.createForClass(Employee);

@Schema()
export class StripeCustomer {
  @Prop()
  stripeCustomerId: string;

  @Prop()
  customerName: string;
}

export const StripeCustomerSchema =
  SchemaFactory.createForClass(StripeCustomer);

@Schema({
  timestamps: true,
})
export class AppUser extends Document {
  @ApiProperty()
  @Prop({ unique: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @Prop()
  @MaxLength(50)
  name: string;

  @ApiProperty()
  @Prop()
  @Length(6, 50)
  password: string;

  @ApiProperty()
  @Prop()
  termsAccepted: boolean;

  @ApiProperty()
  @Prop()
  emailVerified: boolean;

  @ApiProperty()
  @Prop({ default: UserRole.User })
  roles: UserRole[];

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company: Types.ObjectId;

  @ApiProperty()
  @Prop([{ type: Types.ObjectId, ref: 'BusinessPointCard' }])
  businessPointCards: Types.ObjectId[];

  @ApiProperty()
  @Prop([{ type: Types.ObjectId, ref: 'AmountOfPoints' }])
  customerPointCards: Types.ObjectId[];

  @ApiProperty()
  @Prop({ type: [EmployeeSchema], required: false })
  employee: Types.DocumentArray<Employee>;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'StripeCustomer' })
  stripeCustomer: StripeCustomer;
}

export const AuthSchema = SchemaFactory.createForClass(AppUser);
