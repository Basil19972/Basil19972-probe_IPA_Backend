import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { IsNotEmpty } from 'class-validator';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({
  timestamps: true,
})
export class RefreshToken extends Document {
  // Das Document wird für die Typisierung hinzugefügt
  @Prop({ unique: true })
  @IsNotEmpty()
  @ApiProperty()
  token: string;

  @Prop()
  @IsNotEmpty()
  @ApiProperty()
  expiryDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'AppUser' }) // Hier verwenden Sie eine Referenz
  @IsNotEmpty()
  @ApiProperty()
  user: Types.ObjectId; // Sie speichern nur die ObjectId des Users
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
