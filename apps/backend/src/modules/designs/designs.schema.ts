import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DesignDraftDocument = HydratedDocument<DesignDraft>;

@Schema({ collection: 'design_drafts', timestamps: true })
export class DesignDraft {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: [Object], default: [] })
  items: Array<Record<string, unknown>>;

  @Prop({ type: Object, default: {} })
  quoteSnapshot: Record<string, unknown>;

  @Prop({ default: 'draft' })
  status: string;
}

export const DesignDraftSchema = SchemaFactory.createForClass(DesignDraft);
