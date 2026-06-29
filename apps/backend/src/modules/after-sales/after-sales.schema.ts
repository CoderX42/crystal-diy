import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AfterSaleDocument = HydratedDocument<AfterSale>;

@Schema({ collection: 'after_sales', timestamps: true })
export class AfterSale {
  @Prop({ required: true })
  orderNo: string;

  @Prop({ required: true, enum: ['refund', 'return', 'exchange'] })
  type: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  reason?: string;

  @Prop()
  remark?: string;

  @Prop()
  refundNo?: string;
}

export const AfterSaleSchema = SchemaFactory.createForClass(AfterSale);
