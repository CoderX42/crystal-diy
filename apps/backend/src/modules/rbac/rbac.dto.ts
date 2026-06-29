import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateRoleDto extends CreateRoleDto {}
