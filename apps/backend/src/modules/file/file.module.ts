import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { FileController } from './file.controller';
import { FileAsset, FileAssetSchema } from './file.schema';
import { FileService } from './file.service';

@Module({
  imports: [JwtModule.register({}), MongooseModule.forFeature([{ name: FileAsset.name, schema: FileAssetSchema }])],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
