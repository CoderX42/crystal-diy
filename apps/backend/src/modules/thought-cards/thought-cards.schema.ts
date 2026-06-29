import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ThoughtCardDocument = HydratedDocument<ThoughtCard>;

@Schema({ collection: 'thought_cards', timestamps: true })
export class ThoughtCard {
  @Prop({ required: true })
  braceletId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  thought: string;

  @Prop({ type: [String], default: [] })
  suitableFor: string[];

  @Prop()
  solarTerm?: string;

  @Prop()
  posterUrl?: string;

  @Prop({ default: 'draft' })
  status: string;

  @Prop({ type: Object, default: {} })
  templateSnapshot: Record<string, unknown>;
}

export const ThoughtCardSchema = SchemaFactory.createForClass(ThoughtCard);

export type ThoughtCardTemplateDocument = HydratedDocument<ThoughtCardTemplate>;

@Schema({ collection: 'thought_card_templates', timestamps: true })
export class ThoughtCardTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['text', 'poster_9_16'] })
  type: string;

  @Prop({ type: Object, default: {} })
  config: Record<string, unknown>;

  @Prop({ default: true })
  enabled: boolean;
}

export const ThoughtCardTemplateSchema = SchemaFactory.createForClass(ThoughtCardTemplate);
