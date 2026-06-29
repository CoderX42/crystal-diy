import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../../shared/shared.module';
import { Order, OrderSchema } from '../orders/orders.schema';
import { Refund, RefundSchema } from '../payments/payments.schema';
import { AfterSale, AfterSaleSchema } from './after-sales.schema';
import { AfterSalesController } from './after-sales.controller';
import { AfterSalesService } from './after-sales.service';

@Module({
  imports: [
    JwtModule.register({}),
    SharedModule,
    MongooseModule.forFeature([
      { name: AfterSale.name, schema: AfterSaleSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Refund.name, schema: RefundSchema },
    ]),
  ],
  controllers: [AfterSalesController],
  providers: [AfterSalesService],
  exports: [AfterSalesService],
})
export class AfterSalesModule {}
