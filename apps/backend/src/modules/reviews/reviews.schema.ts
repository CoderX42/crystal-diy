import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ collection: 'reviews', timestamps: true })
export class Review {
  @Prop({ required: true })
  orderNo: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  content?: string;

  @Prop({ default: 'pending' })
  status: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
