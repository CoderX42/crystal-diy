import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../common/dto/page.dto';

export class ContentQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(['article', 'banner', 'poster_template', 'home_block'])
  type?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateContentEntryDto {
  @IsIn(['article', 'banner', 'poster_template', 'home_block'])
  type: string;

  @IsString()
  title: string;

  @IsObject()
  payload: Record<string, unknown>;
}

export class AuditContentDto {
  @IsIn(['published', 'rejected', 'archived'])
  status: string;
}

export class UpdateContentEntryDto {
  @IsOptional()
  @IsIn(['article', 'banner', 'poster_template', 'home_block'])
  type?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
