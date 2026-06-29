import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PageQueryDto } from '../../common/dto/page.dto';

export class CatalogQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class SkuQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Boolean)
  enabled?: boolean;
}

export class AppCatalogQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}

export class CreateCatalogItemDto {
  @IsString()
  name: string;

  @IsIn(['bead', 'accessory', 'spacer', 'cord', 'pendant'])
  type: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateCatalogItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['bead', 'accessory', 'spacer', 'cord', 'pendant'])
  type?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateSkuDto {
  @IsString()
  productId: string;

  @IsString()
  skuCode: string;

  @IsString()
  name: string;

  @IsIn(['main_bead', 'bead', 'accessory', 'spacer', 'cord', 'pendant'])
  category: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateSkuDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  skuCode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['main_bead', 'bead', 'accessory', 'spacer', 'cord', 'pendant'])
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class AdjustInventoryDto {
  @IsIn(['inbound', 'outbound', 'adjust', 'lock', 'unlock'])
  type: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
