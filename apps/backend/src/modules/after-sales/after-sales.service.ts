import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { CodeGeneratorService } from '../../shared/code-generator.service';
import { Order } from '../orders/orders.schema';
import { Refund } from '../payments/payments.schema';
import { AfterSale } from './after-sales.schema';
import { CreateAfterSaleDto, HandleAfterSaleDto } from './after-sales.dto';

const AFTER_SALE_ALLOWED_ORDER_STATUSES = ['paid', 'shipped', 'completed', 'reviewed'];

@Injectable()
export class AfterSalesService {
  constructor(
    @InjectModel(AfterSale.name) private readonly model: Model<AfterSale>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Refund.name) private readonly refundModel: Model<Refund>,
    private readonly codeGenerator: CodeGeneratorService,
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
    const orders = await this.orderModel.find({ userId });
    const orderNos = orders.map((order) => order.orderNo);
    const filter = { orderNo: { $in: orderNos } };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async create(payload: CreateAfterSaleDto, userId?: string) {
    const order = await this.orderModel.findOne({ orderNo: payload.orderNo });
    if (!order) throw new NotFoundException('订单不存在');
    if (userId && order.userId !== userId) throw new ForbiddenException('订单不属于当前用户');
    if (!AFTER_SALE_ALLOWED_ORDER_STATUSES.includes(order.status)) throw new BadRequestException('当前订单状态不可申请售后');
    const existing = await this.model.findOne({ orderNo: payload.orderNo, status: { $in: ['pending', 'approved'] } });
    if (existing) throw new BadRequestException('订单已有待处理售后');
    const afterSale = await this.model.create({ ...payload, status: 'pending' });
    await this.orderModel.updateOne({ orderNo: payload.orderNo }, { status: 'after_sale_pending' });
    return afterSale;
  }

  async handle(id: string, payload: HandleAfterSaleDto) {
    const afterSale = await this.model.findById(id);
    if (!afterSale) throw new NotFoundException('售后单不存在');

    if (afterSale.status === 'completed') throw new BadRequestException('售后单已完成');

    const order = await this.orderModel.findOne({ orderNo: afterSale.orderNo });
    if (!order) throw new NotFoundException('订单不存在');

    afterSale.status = payload.status;
    afterSale.remark = payload.remark;

    if (payload.status === 'approved') {
      if (afterSale.type === 'refund' && !afterSale.refundNo) {
        const refund = await this.refundModel.create({
          orderNo: afterSale.orderNo,
          refundNo: this.codeGenerator.orderNo('RF'),
          amount: order.totalAmount,
          reason: afterSale.reason,
          status: 'pending',
        });
        afterSale.refundNo = refund.refundNo;
        order.status = 'refund_pending';
      } else {
        order.status = 'after_sale_pending';
      }
    } else if (payload.status === 'rejected') {
      order.status = this.resolveOrderStatusAfterRejectedAfterSale(order.status);
    } else if (payload.status === 'completed') {
      order.status = afterSale.type === 'refund' ? 'refund_pending' : 'after_sale_completed';
    }

    await order.save();
    await afterSale.save();
    return afterSale;
  }

  private resolveOrderStatusAfterRejectedAfterSale(currentStatus: string) {
    return currentStatus === 'after_sale_pending' ? 'paid' : currentStatus;
  }

  countPending() {
    return this.model.countDocuments({ status: 'pending' });
  }
}
