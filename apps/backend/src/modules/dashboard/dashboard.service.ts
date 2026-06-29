import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogService } from '../catalog/catalog.service';
import { AfterSalesService } from '../after-sales/after-sales.service';
import { ThoughtCardsService } from '../thought-cards/thought-cards.service';
import { Order } from '../orders/orders.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly catalogService: CatalogService,
    private readonly afterSalesService: AfterSalesService,
    private readonly thoughtCardsService: ThoughtCardsService,
  ) {}

  async overview() {
    const [pendingOrders, paidOrders, lowStockSkus, pendingAfterSales, pendingThoughtCards, salesAgg] = await Promise.all([
      this.orderModel.countDocuments({ status: 'pending_payment' }),
      this.orderModel.countDocuments({ status: 'paid' }),
      this.catalogService.countLowStock(),
      this.afterSalesService.countPending(),
      this.thoughtCardsService.countPending(),
      this.orderModel.aggregate([{ $match: { status: { $in: ['paid', 'shipped', 'completed', 'reviewed'] } } }, { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }]),
    ]);
    return {
      pendingOrders,
      paidOrders,
      lowStockSkus,
      pendingAfterSales,
      pendingThoughtCards,
      totalSales: salesAgg[0]?.totalSales ?? 0,
    };
  }
}
