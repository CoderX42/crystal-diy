import { IsOptional, IsString } from 'class-validator';

export class AddDesignToCartDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  designId: string;
}

export class RemoveCartItemDto {
  @IsString()
  designId: string;
}
