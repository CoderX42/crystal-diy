import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentEntry, ContentEntrySchema } from './content.schema';
import { ContentService } from './content.service';

@Module({
  imports: [JwtModule.register({}), MongooseModule.forFeature([{ name: ContentEntry.name, schema: ContentEntrySchema }])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
