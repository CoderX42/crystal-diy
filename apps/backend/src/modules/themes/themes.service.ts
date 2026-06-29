import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { CatalogService } from '../catalog/catalog.service';
import { CreateThemeRuleDto, MatchThemeDto, UpdateThemeRuleDto } from './themes.dto';
import { ThemeRule } from './themes.schema';

@Injectable()
export class ThemesService {
  constructor(
    @InjectModel(ThemeRule.name) private readonly model: Model<ThemeRule>,
    private readonly catalogService: CatalogService,
  ) {}

  async list(query: PageQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  create(payload: CreateThemeRuleDto) {
    return this.model.create({ ...payload, enabled: payload.enabled ?? true });
  }

  async update(id: string, payload: UpdateThemeRuleDto) {
    const rule = await this.model.findByIdAndUpdate(id, payload, { new: true });
    if (!rule) throw new NotFoundException('主题规则不存在');
    return rule;
  }

  async match(dto: MatchThemeDto) {
    const rules = await this.model.find({ themeType: dto.themeType, enabled: true }).sort({ createdAt: -1 });
    const matched = rules.find((rule) => this.conditionsMatch(rule.conditions, dto.profile));
    if (!matched) return { rule: null, skus: [] };
    const skus = await this.catalogService.findSkusByIds(matched.recommendedSkuIds);
    return { rule: matched, skus };
  }

  private conditionsMatch(conditions: Record<string, unknown>, profile: Record<string, unknown>) {
    return Object.entries(conditions).every(([key, expected]) => {
      const actual = profile[key];
      if (Array.isArray(expected)) return expected.includes(actual);
      return expected === actual;
    });
  }
}
