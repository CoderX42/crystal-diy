import { IsArray, IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateThemeRuleDto {
  @IsIn(['wuxing', 'zodiac', 'mbti', 'chinese_zodiac'])
  themeType: string;

  @IsString()
  name: string;

  @IsObject()
  conditions: Record<string, unknown>;

  @IsArray()
  @IsString({ each: true })
  recommendedSkuIds: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateThemeRuleDto {
  @IsOptional()
  @IsIn(['wuxing', 'zodiac', 'mbti', 'chinese_zodiac'])
  themeType?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendedSkuIds?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class MatchThemeDto {
  @IsIn(['wuxing', 'zodiac', 'mbti', 'chinese_zodiac'])
  themeType: string;

  @IsObject()
  profile: Record<string, unknown>;
}
