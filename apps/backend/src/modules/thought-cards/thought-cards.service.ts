import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { PosterService } from '../../shared/poster.service';
import { SolarTermService } from '../../shared/solar-term.service';
import { Bracelet } from '../bracelets/bracelets.schema';
import {
  CreateThoughtCardTemplateDto,
  GenerateThoughtCardDto,
  RewriteThoughtCardDto,
  ThoughtCardTemplateQueryDto,
  UpdateThoughtCardDto,
  UpdateThoughtCardTemplateDto,
} from './thought-cards.dto';
import { ThoughtCard, ThoughtCardTemplate } from './thought-cards.schema';

@Injectable()
export class ThoughtCardsService {
  constructor(
    @InjectModel(ThoughtCard.name) private readonly model: Model<ThoughtCard>,
    @InjectModel(ThoughtCardTemplate.name) private readonly templateModel: Model<ThoughtCardTemplate>,
    @InjectModel(Bracelet.name) private readonly braceletModel: Model<Bracelet>,
    private readonly posterService: PosterService,
    private readonly solarTermService: SolarTermService,
  ) {}

  async list(query: PageQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async listMine(userId: string, query: PageQueryDto) {
    const bracelets = await this.braceletModel.find({ userId });
    const braceletIds = bracelets.map((bracelet) => String((bracelet as { _id: unknown })._id));
    const filter = { braceletId: { $in: braceletIds } };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getMine(id: string, userId: string) {
    const card = await this.model.findById(id);
    if (!card) throw new NotFoundException('念卡不存在');
    await this.assertCardOwner(card.braceletId, userId);
    return card;
  }

  async listTemplates(query: ThoughtCardTemplateQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.enabled !== undefined) filter.enabled = query.enabled;
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.templateModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.templateModel.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  listAppTemplates(query: ThoughtCardTemplateQueryDto) {
    return this.listTemplates({ ...query, enabled: true });
  }

  createTemplate(payload: CreateThoughtCardTemplateDto) {
    return this.templateModel.create({ ...payload, enabled: true });
  }

  async updateTemplate(id: string, payload: UpdateThoughtCardTemplateDto) {
    const template = await this.templateModel.findByIdAndUpdate(id, payload, { new: true });
    if (!template) throw new NotFoundException('念卡模板不存在');
    return template;
  }

  async generate(payload: GenerateThoughtCardDto, userId?: string) {
    const bracelet = await this.braceletModel.findById(payload.braceletId);
    if (!bracelet) throw new NotFoundException('手串记录不存在');
    if (userId && bracelet.userId !== userId) throw new ForbiddenException('手串不属于当前用户');
    const template = payload.templateId ? await this.templateModel.findOne({ _id: payload.templateId, enabled: true }) : null;
    if (payload.templateId && !template) throw new NotFoundException('念卡模板不存在或已停用');
    const solarTerm = this.solarTermService.getTermContext();
    const title = `${bracelet.name || '一念手串'} · 今日之念`;
    const thought = payload.seedText || `愿你在每一次抬手之间，看见当下的安定与光。`;
    return this.model.create({
      braceletId: payload.braceletId,
      title,
      thought,
      suitableFor: solarTerm.suitableFor,
      solarTerm: solarTerm.name,
      status: 'generated',
      templateSnapshot: template ? { id: String(template._id), name: template.name, type: template.type, config: template.config } : {},
    });
  }

  async rewrite(id: string, payload: RewriteThoughtCardDto, userId?: string) {
    const card = await this.model.findById(id);
    if (!card) throw new NotFoundException('念卡不存在');
    if (userId) await this.assertCardOwner(card.braceletId, userId);
    card.thought = payload.instruction ? `${card.thought}\n${payload.instruction}` : `${card.thought}\n愿新的念头温柔生长。`;
    card.status = 'rewritten';
    return card.save();
  }

  async update(id: string, payload: UpdateThoughtCardDto, userId?: string) {
    const existing = await this.model.findById(id);
    if (!existing) throw new NotFoundException('念卡不存在');
    if (userId) await this.assertCardOwner(existing.braceletId, userId);
    const card = await this.model.findByIdAndUpdate(id, payload, { new: true });
    if (!card) throw new NotFoundException('念卡不存在');
    return card;
  }

  async generatePoster(id: string, userId?: string) {
    const card = await this.model.findById(id);
    if (!card) throw new NotFoundException('念卡不存在');
    if (userId) await this.assertCardOwner(card.braceletId, userId);
    card.posterUrl = this.posterService.generateThoughtCardPoster({
      id,
      title: card.title,
      thought: card.thought,
      suitableFor: card.suitableFor ?? [],
      solarTerm: card.solarTerm,
    });
    card.status = 'poster_generated';
    return card.save();
  }

  countPending() {
    return this.model.countDocuments({ status: { $in: ['generated', 'rewritten'] } });
  }

  private async assertCardOwner(braceletId: string, userId: string) {
    const bracelet = await this.braceletModel.findById(braceletId);
    if (!bracelet) throw new NotFoundException('手串记录不存在');
    if (bracelet.userId !== userId) throw new ForbiddenException('念卡不属于当前用户');
  }

}
