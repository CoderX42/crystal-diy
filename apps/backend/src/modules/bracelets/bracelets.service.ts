import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { Order } from '../orders/orders.schema';
import { CreateBraceletDto, AuditBraceletDto } from './bracelets.dto';
import { Bracelet } from './bracelets.schema';

@Injectable()
export class BraceletsService {
  constructor(
    @InjectModel(Bracelet.name) private readonly model: Model<Bracelet>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
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
    const skip = (query.page - 1) * query.pageSize;
    const filter = { userId };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getMine(id: string, userId: string) {
    return this.assertOwner(id, userId);
  }

  async create(payload: CreateBraceletDto, userId?: string) {
    const order = await this.orderModel.findOne({ orderNo: payload.orderNo });
    if (!order) throw new NotFoundException('订单不存在');
    if (userId && order.userId !== userId) throw new ForbiddenException('订单不属于当前用户');
    if (payload.userId && order.userId !== payload.userId) throw new ForbiddenException('订单不属于手串用户');
    if (!['completed', 'reviewed'].includes(order.status)) throw new ForbiddenException('仅已完成订单可进入手串册');
    return this.model.create({ ...payload, userId: userId ?? payload.userId, publicVisible: payload.publicVisible ?? false });
  }

  async assertOwner(id: string, userId: string) {
    const bracelet = await this.model.findById(id);
    if (!bracelet) throw new NotFoundException('手串记录不存在');
    if (bracelet.userId !== userId) throw new ForbiddenException('手串不属于当前用户');
    return bracelet;
  }

  async audit(id: string, payload: AuditBraceletDto) {
    const bracelet = await this.model.findByIdAndUpdate(id, { publicVisible: payload.publicVisible }, { new: true });
    if (!bracelet) throw new NotFoundException('手串记录不存在');
    return bracelet;
  }
}
