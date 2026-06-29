import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { WechatPayService } from '../../infrastructure/wechat/wechat-pay.service';
import { CodeGeneratorService } from '../../shared/code-generator.service';
import { CatalogService } from '../catalog/catalog.service';
import { Order } from '../orders/orders.schema';
import { CompleteRefundDto, CreateRefundDto, CreateWechatPaymentDto, MarkPaymentPaidDto, WechatPayCallbackDto } from './payments.dto';
import { Payment, Refund } from './payments.schema';

const REFUNDABLE_ORDER_STATUSES = ['paid', 'shipped', 'completed', 'reviewed', 'after_sale_pending', 'refund_pending'];

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly model: Model<Payment>,
    @InjectModel(Refund.name) private readonly refundModel: Model<Refund>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly catalogService: CatalogService,
    private readonly wechatPayService: WechatPayService,
  ) {}

  async list(query: PageQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async listRefunds(query: PageQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.refundModel.find().sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.refundModel.countDocuments(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async listMyRefunds(userId: string, query: PageQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const orders = await this.orderModel.find({ userId });
    const orderNos = orders.map((order) => order.orderNo);
    const filter = { orderNo: { $in: orderNos } };
    const [items, total] = await Promise.all([
      this.refundModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.refundModel.countDocuments(filter),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  create(payload: Record<string, unknown>) {
    return this.model.create(payload);
  }

  async createWechatPrepay(dto: CreateWechatPaymentDto, userId?: string, openid?: string) {
    const order = await this.orderModel.findOne({ orderNo: dto.orderNo });
    if (!order) throw new NotFoundException('订单不存在');
    if (userId && order.userId !== userId) throw new ForbiddenException('订单不属于当前用户');
    const prepayPayload = this.wechatPayService.buildJsapiPrepayPayload({ orderNo: order.orderNo, totalAmount: order.totalAmount }, openid ?? 'mock-openid');
    const payment = await this.model.findOneAndUpdate(
      { orderNo: dto.orderNo, channel: 'wechat' },
      {
        orderNo: dto.orderNo,
        channel: 'wechat',
        status: 'pending',
        amount: order.totalAmount,
        prepayPayload,
      },
      { upsert: true, new: true },
    );
    return payment;
  }

  async markPaid(orderNo: string, dto: MarkPaymentPaidDto) {
    return this.handleWechatPaid({ orderNo, transactionId: dto.transactionId, amount: 0 }, true);
  }

  async handleWechatPaid(dto: WechatPayCallbackDto, adminOverride = false) {
    const order = await this.orderModel.findOne({ orderNo: dto.orderNo });
    if (!order) throw new NotFoundException('订单不存在');
    if (!adminOverride && dto.amount !== order.totalAmount) throw new BadRequestException('支付金额不匹配');

    const existingPayment = await this.model.findOne({ orderNo: dto.orderNo, channel: 'wechat' });
    if (existingPayment?.status === 'paid') {
      return { payment: existingPayment, order, duplicated: true };
    }

    const payment = await this.model.findOneAndUpdate(
      { orderNo: dto.orderNo, channel: 'wechat' },
      {
        orderNo: dto.orderNo,
        channel: 'wechat',
        status: 'paid',
        amount: order.totalAmount,
        transactionId: dto.transactionId,
      },
      { upsert: true, new: true },
    );

    if (order.inventoryStatus === 'locked') {
      await this.catalogService.confirmDesignItems(order.items, `paid:${order.orderNo}`);
      order.inventoryStatus = 'deducted';
    }
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();

    return { payment, order, duplicated: false };
  }


  async completeRefund(dto: CompleteRefundDto) {
    const refund = await this.refundModel.findOne({ refundNo: dto.refundNo });
    if (!refund) throw new NotFoundException('退款单不存在');
    const order = await this.orderModel.findOne({ orderNo: refund.orderNo });
    if (!order) throw new NotFoundException('订单不存在');
    if (refund.status === 'completed') {
      return { refund, order, duplicated: true };
    }

    if (order.inventoryStatus === 'deducted') {
      await this.catalogService.restoreDesignItems(order.items, `refund:${refund.refundNo}`);
      order.inventoryStatus = 'restored';
    } else if (order.inventoryStatus === 'locked') {
      await this.catalogService.unlockDesignItems(order.items, `refund:${refund.refundNo}`);
      order.inventoryStatus = 'unlocked';
    }
    order.status = 'refunded';
    await order.save();

    refund.status = 'completed';
    refund.completedAt = new Date();
    await refund.save();
    return { refund, order, duplicated: false };
  }

  async createRefund(dto: CreateRefundDto, userId?: string) {
    const order = await this.orderModel.findOne({ orderNo: dto.orderNo });
    if (!order) throw new NotFoundException('订单不存在');
    if (userId && order.userId !== userId) throw new ForbiddenException('订单不属于当前用户');
    if (!REFUNDABLE_ORDER_STATUSES.includes(order.status)) throw new BadRequestException('当前订单状态不可退款');
    if (dto.amount > order.totalAmount) throw new BadRequestException('退款金额不能超过订单金额');

    const existingPendingRefund = await this.refundModel.findOne({
      orderNo: dto.orderNo,
      status: { $in: ['pending', 'processing'] },
    });
    if (existingPendingRefund) throw new BadRequestException('订单已有待处理退款');

    const completedRefunds = await this.refundModel.find({ orderNo: dto.orderNo, status: 'completed' });
    const refundedAmount = completedRefunds.reduce((sum, refund) => sum + refund.amount, 0);
    if (refundedAmount + dto.amount > order.totalAmount) throw new BadRequestException('累计退款金额不能超过订单金额');

    const refund = await this.refundModel.create({
      orderNo: dto.orderNo,
      refundNo: this.codeGenerator.orderNo('RF'),
      amount: dto.amount,
      reason: dto.reason,
      status: 'pending',
    });
    await this.orderModel.updateOne({ orderNo: dto.orderNo }, { status: 'refund_pending' });
    return refund;
  }
}
