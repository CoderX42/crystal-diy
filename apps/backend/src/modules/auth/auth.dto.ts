import { IsObject, IsOptional, IsString } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsObject()
  profile?: Record<string, unknown>;
}
