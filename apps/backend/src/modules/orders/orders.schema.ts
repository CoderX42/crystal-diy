import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ collection: 'orders', timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNo: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: [Object], default: [] })
  items: Array<Record<string, unknown>>;

  @Prop({ type: Object, default: {} })
  addressSnapshot: Record<string, unknown>;

  @Prop({ required: true, default: 0 })
  totalAmount: number;

  @Prop({ default: 'pending_payment' })
  status: string;

  @Prop({ type: Object, default: {} })
  shippingInfo: Record<string, unknown>;

  @Prop({ default: 'pending_lock' })
  inventoryStatus: string;

  @Prop()
  paidAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
