import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsArray()
  @IsString({ each: true })
  roleIds: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
