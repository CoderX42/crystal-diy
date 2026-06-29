import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BraceletDocument = HydratedDocument<Bracelet>;

@Schema({ collection: 'bracelets', timestamps: true })
export class Bracelet {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  orderNo: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: false })
  publicVisible: boolean;
}

export const BraceletSchema = SchemaFactory.createForClass(Bracelet);
