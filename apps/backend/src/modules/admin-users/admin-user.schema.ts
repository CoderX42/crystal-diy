import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdminUserDocument = HydratedDocument<AdminUser>;

@Schema({ collection: 'admin_users', timestamps: true })
export class AdminUser {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ trim: true })
  nickname?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  roles: Types.ObjectId[];

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
