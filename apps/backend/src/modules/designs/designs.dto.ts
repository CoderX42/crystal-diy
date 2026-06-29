import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class DesignItemDto {
  @IsString()
  instanceId: string;

  @IsString()
  skuId: string;

  @IsString()
  productId: string;

  @IsIn(['main_bead', 'bead', 'accessory', 'spacer', 'cord', 'pendant'])
  category: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  position: number;
}

export class QuoteDesignDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  themeType?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignItemDto)
  items: DesignItemDto[];
}

export class SaveDesignDraftDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  themeType?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignItemDto)
  items: DesignItemDto[];
}

export class ReorderDesignDraftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignItemDto)
  items: DesignItemDto[];
}
