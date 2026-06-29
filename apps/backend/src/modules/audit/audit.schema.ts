import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  @Prop()
  adminId?: string;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Object, default: {} })
  detail: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
