import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../catalog/catalog.module';
import { DesignsController } from './designs.controller';
import { DesignDraft, DesignDraftSchema } from './designs.schema';
import { DesignsService } from './designs.service';

@Module({
  imports: [JwtModule.register({}), CatalogModule, MongooseModule.forFeature([{ name: DesignDraft.name, schema: DesignDraftSchema }])],
  controllers: [DesignsController],
  providers: [DesignsService],
  exports: [DesignsService],
})
export class DesignsModule {}
