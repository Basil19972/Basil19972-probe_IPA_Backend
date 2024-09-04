import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class BusinessPointCard extends Document {
  @Prop()
  @ApiProperty()
  name: string;

  @Prop()
  @ApiProperty()
  maxpoints: number;

  @Prop()
  @ApiProperty()
  discount: number;

  @Prop()
  @ApiProperty()
  description: string;

  @ApiProperty()
  @Prop({ default: false })
  isDeleted: boolean;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company: Types.ObjectId;
}

export const BusinessPointCardSchema =
  SchemaFactory.createForClass(BusinessPointCard);
