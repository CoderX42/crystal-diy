import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateOrderFromCartDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  cartId: string;

  @IsString()
  addressId: string;
}

export class ShipOrderDto {
  @IsString()
  carrier: string;

  @IsString()
  trackingNo: string;

  @IsObject()
  addressSnapshot: Record<string, unknown>;
}
