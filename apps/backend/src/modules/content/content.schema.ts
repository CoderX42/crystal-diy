import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContentEntryDocument = HydratedDocument<ContentEntry>;

@Schema({ collection: 'content_entries', timestamps: true })
export class ContentEntry {
  @Prop({ required: true, enum: ['article', 'banner', 'poster_template', 'home_block'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  @Prop({ default: 'draft' })
  status: string;
}

export const ContentEntrySchema = SchemaFactory.createForClass(ContentEntry);
