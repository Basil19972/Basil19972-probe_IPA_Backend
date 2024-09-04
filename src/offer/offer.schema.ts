import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema()
export class UserScan {
  @Prop({ type: Types.ObjectId, ref: 'AppUser' })
  appUser: Types.ObjectId;

  @Prop()
  scanCount: number;
}

@Schema({
  timestamps: true,
})
export class Offer extends Document {
  @Prop()
  @ApiProperty()
  title: string;

  @Prop()
  @ApiProperty()
  productName: string;

  @Prop()
  @ApiProperty()
  description: string;

  @Prop()
  @ApiProperty()
  discount: number;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company: Types.ObjectId;

  @ApiProperty()
  @Prop()
  customerLevelRange: [number];

  @ApiProperty()
  @Prop()
  amountOfScans: number;

  @ApiProperty()
  @Prop()
  offerToken: string;

  @ApiProperty()
  @Prop({ type: [UserScan] })
  userScans: Types.DocumentArray<UserScan>;

  @ApiProperty({ type: Date })
  @Prop()
  startDate: Date;

  @ApiProperty({ type: Date })
  @Prop()
  endDate: Date;
}

export const offerSchema = SchemaFactory.createForClass(Offer);
