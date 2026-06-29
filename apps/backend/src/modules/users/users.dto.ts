import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  receiver: string;

  @IsString()
  phone: string;

  @IsString()
  province: string;

  @IsString()
  city: string;

  @IsString()
  district: string;

  @IsString()
  detail: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  profile?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
