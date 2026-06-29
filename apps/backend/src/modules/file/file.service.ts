import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileAsset } from './file.schema';

@Injectable()
export class FileService {
  constructor(
    @InjectModel(FileAsset.name) private readonly fileModel: Model<FileAsset>,
    private readonly config: ConfigService,
  ) {}

  async saveUploadedFile(file: Express.Multer.File) {
    const publicBaseUrl = this.config.get<string>('PUBLIC_BASE_URL', 'http://localhost:3000');
    return this.fileModel.create({
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `${publicBaseUrl}/uploads/${file.filename}`,
      storage: 'local',
    });
  }
}
