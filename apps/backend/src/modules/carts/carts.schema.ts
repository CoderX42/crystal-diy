import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ collection: 'carts', timestamps: true })
export class Cart {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: [Object], default: [] })
  items: Array<Record<string, unknown>>;

  @Prop({ default: true })
  active: boolean;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
