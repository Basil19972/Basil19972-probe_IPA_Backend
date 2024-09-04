import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

// Definiere das Schema für einen einzelnen Punkt
@Schema({ timestamps: true }) // Aktiviere Timestamps für jeden Punkt
export class Point {
  @Prop({ default: 1 }) // Standardmäßig hat jeder Punkt den Wert 1
  value: number;

  @Prop({ type: Types.ObjectId, ref: 'AppUser' })
  pointCreatorID: Types.ObjectId;

  @Prop()
  createdAt?: Date;

  // Konstruktor hinzufügen
  constructor(data?: { pointCreatorID?: Types.ObjectId }) {
    if (data) {
      if (data.pointCreatorID) this.pointCreatorID = data.pointCreatorID;
    }
  }
}

// Erstelle das Schema für Point
export const PointSchema = SchemaFactory.createForClass(Point);

// CustomerPointCard Schema Definition
@Schema({
  timestamps: true,
})
export class CustomerPointCard extends Document {
  @ApiProperty()
  @Prop({ type: [PointSchema], default: [] }) // Ein Array von Punkten
  points: Point[];

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'BusinessPointCard' })
  pointCard: Types.ObjectId;

  @ApiProperty()
  @Prop({ default: false })
  hasFullPoints: boolean;

  @ApiProperty()
  @Prop({ default: false })
  isScanned: boolean;

  @ApiProperty()
  @Prop()
  cardIsFullToken: string;

  @ApiProperty()
  @Prop({ default: false })
  pointCradIsDeleted: boolean;
}

// Erstelle das Schema für CustomerPointCard
export const CustomerPointCardSchema =
  SchemaFactory.createForClass(CustomerPointCard);
