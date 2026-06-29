import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AppCatalogController, CatalogController } from './catalog.controller';
import { CatalogItem, CatalogItemSchema, InventoryLog, InventoryLogSchema, Sku, SkuSchema } from './catalog.schema';
import { CatalogService } from './catalog.service';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: CatalogItem.name, schema: CatalogItemSchema },
      { name: Sku.name, schema: SkuSchema },
      { name: InventoryLog.name, schema: InventoryLogSchema },
    ]),
  ],
  controllers: [CatalogController, AppCatalogController],
  providers: [CatalogService],
  exports: [CatalogService, MongooseModule],
})
export class CatalogModule {}
