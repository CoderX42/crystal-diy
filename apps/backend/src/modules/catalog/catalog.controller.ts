import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CatalogService } from './catalog.service';
import {
  AdjustInventoryDto,
  AppCatalogQueryDto,
  CatalogQueryDto,
  CreateCatalogItemDto,
  CreateSkuDto,
  SkuQueryDto,
  UpdateCatalogItemDto,
  UpdateSkuDto,
} from './catalog.dto';

class InventoryLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize = 20;
}

@ApiTags('商品素材')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get()
  @Permissions('catalog:manage')
  list(@Query() query: CatalogQueryDto) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('catalog:manage')
  create(@Body() payload: CreateCatalogItemDto) {
    return this.service.create(payload);
  }

  @Patch(':id')
  @Permissions('catalog:manage')
  update(@Param('id') id: string, @Body() payload: UpdateCatalogItemDto) {
    return this.service.update(id, payload);
  }

  @Get('skus')
  @Permissions('catalog:manage')
  listSkus(@Query() query: SkuQueryDto) {
    return this.service.listSkus(query);
  }

  @Post('skus')
  @Permissions('catalog:manage')
  createSku(@Body() payload: CreateSkuDto) {
    return this.service.createSku(payload);
  }

  @Patch('skus/:id')
  @Permissions('catalog:manage')
  updateSku(@Param('id') id: string, @Body() payload: UpdateSkuDto) {
    return this.service.updateSku(id, payload);
  }

  @Post('skus/:id/inventory')
  @Permissions('catalog:manage')
  adjustInventory(@Param('id') id: string, @Body() payload: AdjustInventoryDto) {
    return this.service.adjustInventory(id, payload);
  }

  @Get('skus/:id/inventory-logs')
  @Permissions('catalog:manage')
  listInventoryLogs(@Param('id') id: string, @Query() query: InventoryLogQueryDto) {
    return this.service.listInventoryLogs(id, query.page, query.pageSize);
  }
}

@ApiTags('小程序选品')
@Controller('app/catalog')
export class AppCatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get('skus')
  listSkus(@Query() query: AppCatalogQueryDto) {
    return this.service.listAppSkus(query);
  }

  @Get('picker')
  picker(@Query() query: AppCatalogQueryDto) {
    return this.service.listAppPicker(query);
  }
}
