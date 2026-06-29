import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { Order } from '../orders/orders.schema';
import { AuditReviewDto, CreateReviewDto } from './reviews.dto';
import { Review } from './reviews.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly model: Model<Review>,
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

  async create(payload: CreateReviewDto, userId?: string) {
    const order = await this.orderModel.findOne({ orderNo: payload.orderNo });
    if (!order) throw new NotFoundException('订单不存在');
    if (userId && order.userId !== userId) throw new ForbiddenException('订单不属于当前用户');
    if (payload.userId && order.userId !== payload.userId) throw new ForbiddenException('订单不属于评价用户');
    const review = await this.model.create({ ...payload, status: 'pending' });
    await this.orderModel.updateOne({ orderNo: payload.orderNo }, { status: 'reviewed' });
    return review;
  }

  async audit(id: string, payload: AuditReviewDto) {
    const review = await this.model.findByIdAndUpdate(id, { status: payload.status }, { new: true });
    if (!review) throw new NotFoundException('评价不存在');
    return review;
  }
}
