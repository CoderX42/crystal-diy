import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../catalog/catalog.module';
import { AfterSalesModule } from '../after-sales/after-sales.module';
import { ThoughtCardsModule } from '../thought-cards/thought-cards.module';
import { Order, OrderSchema } from '../orders/orders.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    JwtModule.register({}),
    CatalogModule,
    AfterSalesModule,
    ThoughtCardsModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
