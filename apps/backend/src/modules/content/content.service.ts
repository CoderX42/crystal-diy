import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditContentDto, ContentQueryDto, CreateContentEntryDto, UpdateContentEntryDto } from './content.dto';
import { ContentEntry } from './content.schema';

@Injectable()
export class ContentService {
  constructor(@InjectModel(ContentEntry.name) private readonly model: Model<ContentEntry>) {}

  async list(query: ContentQueryDto) {
    const filter = this.buildFilter(query);
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async listPublished(query: ContentQueryDto) {
    const filter = { ...this.buildFilter(query), status: 'published' };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getPublished(id: string) {
    const entry = await this.model.findOne({ _id: id, status: 'published' });
    if (!entry) throw new NotFoundException('内容不存在');
    return entry;
  }

  create(payload: CreateContentEntryDto) {
    return this.model.create({ ...payload, status: 'draft' });
  }

  async update(id: string, payload: UpdateContentEntryDto) {
    const entry = await this.model.findByIdAndUpdate(id, payload, { new: true });
    if (!entry) throw new NotFoundException('内容不存在');
    return entry;
  }

  async audit(id: string, payload: AuditContentDto) {
    const entry = await this.model.findByIdAndUpdate(id, { status: payload.status }, { new: true });
    if (!entry) throw new NotFoundException('内容不存在');
    return entry;
  }

  private buildFilter(query: ContentQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.keyword) filter.title = { $regex: query.keyword, $options: 'i' };
    return filter;
  }
}
