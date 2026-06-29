import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../common/dto/page.dto';

export class CreateThoughtCardTemplateDto {
  @IsString()
  name: string;

  @IsIn(['text', 'poster_9_16'])
  type: string;

  @IsObject()
  config: Record<string, unknown>;
}

export class ThoughtCardTemplateQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateThoughtCardTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['text', 'poster_9_16'])
  type?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class GenerateThoughtCardDto {
  @IsString()
  braceletId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  seedText?: string;
}

export class RewriteThoughtCardDto {
  @IsOptional()
  @IsString()
  instruction?: string;
}

export class UpdateThoughtCardDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  thought?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suitableFor?: string[];
}
