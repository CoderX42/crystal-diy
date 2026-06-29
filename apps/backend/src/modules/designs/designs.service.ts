import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { CatalogService } from '../catalog/catalog.service';
import { DesignDraft } from './designs.schema';
import { QuoteDesignDto, ReorderDesignDraftDto, SaveDesignDraftDto } from './designs.dto';

@Injectable()
export class DesignsService {
  constructor(
    @InjectModel(DesignDraft.name) private readonly model: Model<DesignDraft>,
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

  create(payload: Record<string, unknown>) {
    return this.model.create(payload);
  }

  async listMine(userId: string, query: PageQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const filter = { userId };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getMine(id: string, userId: string) {
    const design = await this.model.findById(id);
    if (!design) throw new NotFoundException('设计不存在');
    if (design.userId !== userId) throw new ForbiddenException('设计不属于当前用户');
    return design;
  }

  async saveDraft(dto: SaveDesignDraftDto) {
    if (!dto.items.length) throw new BadRequestException('设计不能为空');
    return this.model.create({
      userId: dto.userId,
      items: this.sortItems(dto.items),
      quoteSnapshot: {},
      status: 'draft',
    } as Partial<DesignDraft>);
  }

  async reorder(id: string, dto: ReorderDesignDraftDto, userId: string) {
    const design = await this.getMine(id, userId);
    if (!dto.items.length) throw new BadRequestException('设计不能为空');
    design.items = this.sortItems(dto.items);
    design.status = design.status === 'quoted' ? 'draft' : design.status;
    design.quoteSnapshot = {};
    return design.save();
  }

  async quote(dto: QuoteDesignDto) {
    if (!dto.items.length) throw new BadRequestException('设计不能为空');
    const skuIds = Array.from(new Set(dto.items.map((item) => item.skuId)));
    const skus = await this.catalogService.findSkusByIds(skuIds);
    const skuMap = new Map(skus.map((sku) => [String(sku._id), sku]));
    const quantityBySku = new Map<string, number>();
    for (const item of dto.items) quantityBySku.set(item.skuId, (quantityBySku.get(item.skuId) ?? 0) + item.quantity);

    const unavailableItems = [] as Array<{ skuId: string; reason: string }>;
    let totalAmount = 0;
    for (const [skuId, quantity] of quantityBySku.entries()) {
      const sku = skuMap.get(skuId);
      if (!sku) {
        unavailableItems.push({ skuId, reason: 'SKU不存在或已下架' });
        continue;
      }
      const availableStock = sku.stock - sku.lockedStock;
      if (availableStock < quantity) unavailableItems.push({ skuId, reason: `库存不足，剩余${availableStock}` });
      totalAmount += sku.price * quantity;
    }

    const categorySet = new Set(dto.items.map((item) => item.category));
    if (!categorySet.has('cord')) unavailableItems.push({ skuId: 'cord', reason: '必须选择绳子' });
    if (!categorySet.has('bead') && !categorySet.has('main_bead')) unavailableItems.push({ skuId: 'bead', reason: '必须选择珠子' });

    const quote = {
      totalAmount,
      itemCount: dto.items.reduce((sum, item) => sum + item.quantity, 0),
      makeable: unavailableItems.length === 0,
      unavailableItems,
      quotedAt: new Date().toISOString(),
    };

    const draftPayload = {
      userId: dto.userId,
      items: this.sortItems(dto.items),
      quoteSnapshot: quote,
      status: quote.makeable ? 'quoted' : 'unmakeable',
    };
    const draft = await this.model.create(draftPayload as Partial<DesignDraft>);

    return { designId: String((draft as { _id: unknown })._id), ...quote };
  }

  private sortItems(items: QuoteDesignDto['items']) {
    return [...items].sort((a, b) => a.position - b.position).map((item) => ({ ...item }));
  }
}
