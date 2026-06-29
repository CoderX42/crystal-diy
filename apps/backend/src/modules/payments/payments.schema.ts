import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ collection: 'payments', timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderNo: string;

  @Prop({ default: 'wechat' })
  channel: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({ default: 0 })
  amount: number;

  @Prop()
  transactionId?: string;

  @Prop({ type: Object, default: {} })
  prepayPayload: Record<string, unknown>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

export type RefundDocument = HydratedDocument<Refund>;

@Schema({ collection: 'refunds', timestamps: true })
export class Refund {
  @Prop({ required: true })
  orderNo: string;

  @Prop({ required: true })
  refundNo: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  reason?: string;

  @Prop()
  completedAt?: Date;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);
