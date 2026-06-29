import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatalogItemDocument = HydratedDocument<CatalogItem>;

@Schema({ collection: 'catalog_items', timestamps: true })
export class CatalogItem {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['bead', 'accessory', 'spacer', 'cord', 'pendant'] })
  type: string;

  @Prop({ trim: true })
  material?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: true })
  enabled: boolean;
}

export const CatalogItemSchema = SchemaFactory.createForClass(CatalogItem);

export type SkuDocument = HydratedDocument<Sku>;

@Schema({ collection: 'skus', timestamps: true })
export class Sku {
  @Prop({ required: true, trim: true })
  productId: string;

  @Prop({ required: true, unique: true, trim: true })
  skuCode: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['main_bead', 'bead', 'accessory', 'spacer', 'cord', 'pendant'] })
  category: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ required: true, default: 0 })
  lockedStock: number;

  @Prop({ default: true })
  enabled: boolean;
}

export const SkuSchema = SchemaFactory.createForClass(Sku);

export type InventoryLogDocument = HydratedDocument<InventoryLog>;

@Schema({ collection: 'inventory_logs', timestamps: true })
export class InventoryLog {
  @Prop({ required: true })
  skuId: string;

  @Prop({ required: true, enum: ['inbound', 'outbound', 'adjust', 'lock', 'unlock'] })
  type: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  beforeStock: number;

  @Prop({ required: true })
  afterStock: number;

  @Prop()
  remark?: string;
}

export const InventoryLogSchema = SchemaFactory.createForClass(InventoryLog);
