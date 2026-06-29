import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, index: true })
  appId: string;

  @Prop({ required: true, index: true })
  openid: string;

  @Prop({ index: true })
  unionid?: string;

  @Prop()
  nickname?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  phone?: string;

  @Prop({ type: Object, default: {} })
  profile: Record<string, unknown>;

  @Prop({ default: true })
  enabled: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ appId: 1, openid: 1 }, { unique: true });

export type UserAddressDocument = HydratedDocument<UserAddress>;

@Schema({ collection: 'user_addresses', timestamps: true })
export class UserAddress {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  receiver: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  province: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  detail: string;

  @Prop({ default: false })
  isDefault: boolean;
}

export const UserAddressSchema = SchemaFactory.createForClass(UserAddress);
