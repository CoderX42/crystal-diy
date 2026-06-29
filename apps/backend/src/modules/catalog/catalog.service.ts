import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdjustInventoryDto,
  AppCatalogQueryDto,
  CatalogQueryDto,
  CreateCatalogItemDto,
  CreateSkuDto,
  SkuQueryDto,
  UpdateCatalogItemDto,
  UpdateSkuDto,
} from './catalog.dto';
import { CatalogItem, InventoryLog, Sku } from './catalog.schema';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(CatalogItem.name) private readonly itemModel: Model<CatalogItem>,
    @InjectModel(Sku.name) private readonly skuModel: Model<Sku>,
    @InjectModel(InventoryLog.name) private readonly inventoryLogModel: Model<InventoryLog>,
  ) {}

  async list(query: CatalogQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.keyword) filter.name = { $regex: query.keyword, $options: 'i' };
    if (query.type) filter.type = query.type;
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.itemModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.itemModel.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  create(payload: CreateCatalogItemDto) {
    return this.itemModel.create({ ...payload, enabled: payload.enabled ?? true });
  }

  async update(id: string, payload: UpdateCatalogItemDto) {
    const item = await this.itemModel.findByIdAndUpdate(id, payload, { new: true });
    if (!item) throw new NotFoundException('商品素材不存在');
    return item;
  }

  async listSkus(query: SkuQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.keyword) filter.name = { $regex: query.keyword, $options: 'i' };
    if (query.category) filter.category = query.category;
    if (query.enabled !== undefined) filter.enabled = query.enabled;
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.skuModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.skuModel.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  createSku(payload: CreateSkuDto) {
    return this.skuModel.create({ ...payload, lockedStock: 0, enabled: payload.enabled ?? true });
  }

  async updateSku(id: string, payload: UpdateSkuDto) {
    const sku = await this.skuModel.findByIdAndUpdate(id, payload, { new: true });
    if (!sku) throw new NotFoundException('SKU不存在');
    return sku;
  }

  async listAppSkus(query: AppCatalogQueryDto) {
    const filter: Record<string, unknown> = { enabled: true };
    if (query.keyword) filter.name = { $regex: query.keyword, $options: 'i' };
    if (query.category) filter.category = query.category;
    if (query.productId) filter.productId = query.productId;
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.skuModel.find(filter).sort({ category: 1, createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.skuModel.countDocuments(filter),
    ]);
    return {
      items: items.map((item) => ({
        id: String((item as { _id: unknown })._id),
        productId: item.productId,
        skuCode: item.skuCode,
        name: item.name,
        category: item.category,
        price: item.price,
        stock: item.stock,
        lockedStock: item.lockedStock,
        availableStock: Math.max(0, item.stock - item.lockedStock),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async listAppPicker(query: AppCatalogQueryDto) {
    const result = await this.listAppSkus(query);
    const grouped = result.items.reduce<Record<string, typeof result.items>>((groups, item) => {
      groups[item.category] = groups[item.category] ?? [];
      groups[item.category].push(item);
      return groups;
    }, {});
    return { ...result, grouped };
  }

  findSkusByIds(ids: string[]) {
    return this.skuModel.find({ _id: { $in: ids }, enabled: true });
  }

  async adjustInventory(skuId: string, dto: AdjustInventoryDto) {
    const sku = await this.skuModel.findById(skuId);
    if (!sku) throw new NotFoundException('SKU不存在');
    const beforeStock = sku.stock;
    const beforeLockedStock = sku.lockedStock;

    if (dto.type === 'inbound') sku.stock += dto.quantity;
    if (dto.type === 'outbound') sku.stock -= dto.quantity;
    if (dto.type === 'adjust') sku.stock = dto.quantity;
    if (dto.type === 'lock') sku.lockedStock += dto.quantity;
    if (dto.type === 'unlock') sku.lockedStock -= dto.quantity;

    if (sku.stock < 0) throw new BadRequestException('库存不能小于0');
    if (sku.lockedStock < 0) throw new BadRequestException('锁定库存不能小于0');
    if (sku.lockedStock > sku.stock) throw new BadRequestException('锁定库存不能大于总库存');

    await sku.save();
    const log = await this.inventoryLogModel.create({
      skuId,
      type: dto.type,
      quantity: dto.quantity,
      beforeStock: dto.type === 'lock' || dto.type === 'unlock' ? beforeLockedStock : beforeStock,
      afterStock: dto.type === 'lock' || dto.type === 'unlock' ? sku.lockedStock : sku.stock,
      remark: dto.remark,
    });
    return { sku, log };
  }


  async lockDesignItems(items: Array<Record<string, unknown>>, remark: string) {
    const quantities = this.collectSkuQuantities(items);
    const results = [] as Array<{ quantity: number; sku: Sku }>;
    for (const [skuId, quantity] of quantities.entries()) {
      const sku = await this.skuModel.findById(skuId);
      if (!sku) throw new NotFoundException(`SKU不存在：${skuId}`);
      const availableStock = sku.stock - sku.lockedStock;
      if (availableStock < quantity) throw new BadRequestException(`SKU库存不足：${sku.name}`);
      const beforeLocked = sku.lockedStock;
      sku.lockedStock += quantity;
      await sku.save();
      await this.inventoryLogModel.create({
        skuId,
        type: 'lock',
        quantity,
        beforeStock: beforeLocked,
        afterStock: sku.lockedStock,
        remark,
      });
      results.push({ sku, quantity });
    }
    return results;
  }

  async confirmDesignItems(items: Array<Record<string, unknown>>, remark: string) {
    const quantities = this.collectSkuQuantities(items);
    const results = [] as Array<{ quantity: number; sku: Sku }>;
    for (const [skuId, quantity] of quantities.entries()) {
      const sku = await this.skuModel.findById(skuId);
      if (!sku) throw new NotFoundException(`SKU不存在：${skuId}`);
      if (sku.lockedStock < quantity) throw new BadRequestException(`SKU锁定库存不足：${sku.name}`);
      const beforeStock = sku.stock;
      sku.stock -= quantity;
      sku.lockedStock -= quantity;
      if (sku.stock < 0 || sku.lockedStock < 0) throw new BadRequestException(`SKU库存异常：${sku.name}`);
      await sku.save();
      await this.inventoryLogModel.create({
        skuId,
        type: 'outbound',
        quantity,
        beforeStock,
        afterStock: sku.stock,
        remark,
      });
      results.push({ sku, quantity });
    }
    return results;
  }


  async restoreDesignItems(items: Array<Record<string, unknown>>, remark: string) {
    const quantities = this.collectSkuQuantities(items);
    const results = [] as Array<{ quantity: number; sku: Sku }>;
    for (const [skuId, quantity] of quantities.entries()) {
      const sku = await this.skuModel.findById(skuId);
      if (!sku) throw new NotFoundException(`SKU不存在：${skuId}`);
      const beforeStock = sku.stock;
      sku.stock += quantity;
      await sku.save();
      await this.inventoryLogModel.create({
        skuId,
        type: 'inbound',
        quantity,
        beforeStock,
        afterStock: sku.stock,
        remark,
      });
      results.push({ sku, quantity });
    }
    return results;
  }

  async unlockDesignItems(items: Array<Record<string, unknown>>, remark: string) {
    const quantities = this.collectSkuQuantities(items);
    const results = [] as Array<{ quantity: number; sku: Sku }>;
    for (const [skuId, quantity] of quantities.entries()) {
      const sku = await this.skuModel.findById(skuId);
      if (!sku) throw new NotFoundException(`SKU不存在：${skuId}`);
      const beforeLocked = sku.lockedStock;
      sku.lockedStock = Math.max(0, sku.lockedStock - quantity);
      await sku.save();
      await this.inventoryLogModel.create({
        skuId,
        type: 'unlock',
        quantity,
        beforeStock: beforeLocked,
        afterStock: sku.lockedStock,
        remark,
      });
      results.push({ sku, quantity });
    }
    return results;
  }

  private collectSkuQuantities(items: Array<Record<string, unknown>>) {
    const quantities = new Map<string, number>();
    const visit = (entry: Record<string, unknown>) => {
      if (Array.isArray(entry.items)) {
        for (const child of entry.items as Array<Record<string, unknown>>) visit(child);
        return;
      }
      const skuId = String(entry.skuId ?? '');
      if (!skuId) return;
      const quantity = Number(entry.quantity ?? 1);
      quantities.set(skuId, (quantities.get(skuId) ?? 0) + quantity);
    };
    for (const item of items) visit(item);
    return quantities;
  }

  async listInventoryLogs(skuId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.inventoryLogModel.find({ skuId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      this.inventoryLogModel.countDocuments({ skuId }),
    ]);
    return { items, total, page, pageSize };
  }

  countLowStock(threshold = 5) {
    return this.skuModel.countDocuments({ enabled: true, $expr: { $lte: [{ $subtract: ['$stock', '$lockedStock'] }, threshold] } });
  }
}
