import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FileAssetDocument = HydratedDocument<FileAsset>;

@Schema({ collection: 'file_assets', timestamps: true })
export class FileAsset {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  url: string;

  @Prop({ default: 'local' })
  storage: string;
}

export const FileAssetSchema = SchemaFactory.createForClass(FileAsset);
