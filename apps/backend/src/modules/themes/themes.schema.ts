import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ThemeRuleDocument = HydratedDocument<ThemeRule>;

@Schema({ collection: 'theme_rules', timestamps: true })
export class ThemeRule {
  @Prop({ required: true, enum: ['wuxing', 'zodiac', 'mbti', 'chinese_zodiac'] })
  themeType: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Object, default: {} })
  conditions: Record<string, unknown>;

  @Prop({ type: [String], default: [] })
  recommendedSkuIds: string[];

  @Prop({ default: true })
  enabled: boolean;
}

export const ThemeRuleSchema = SchemaFactory.createForClass(ThemeRule);
