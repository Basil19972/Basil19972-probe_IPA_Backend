import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Max } from 'class-validator';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class QRCode extends Document {
  @Prop()
  @Max(20)
  @ApiProperty()
  points: number;

  @Prop({ type: Types.ObjectId, ref: 'AppUser' })
  @IsNotEmpty()
  @ApiProperty()
  businessAppUserID: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BusinessPointCard' })
  @IsNotEmpty()
  @ApiProperty()
  businessPointCardID: Types.ObjectId;

  @Prop()
  @IsNotEmpty()
  @ApiProperty()
  token: string;
}

export const QRCodeSchema = SchemaFactory.createForClass(QRCode);
