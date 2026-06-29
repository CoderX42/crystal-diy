import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBraceletDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  orderNo: string;

  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsOptional()
  @IsBoolean()
  publicVisible?: boolean;
}

export class AuditBraceletDto {
  @IsBoolean()
  publicVisible: boolean;
}
