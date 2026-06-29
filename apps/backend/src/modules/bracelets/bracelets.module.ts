import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { BraceletsController } from './bracelets.controller';
import { Order, OrderSchema } from '../orders/orders.schema';
import { Bracelet, BraceletSchema } from './bracelets.schema';
import { BraceletsService } from './bracelets.service';

@Module({
  imports: [JwtModule.register({}), MongooseModule.forFeature([{ name: Bracelet.name, schema: BraceletSchema },
      { name: Order.name, schema: OrderSchema }])],
  controllers: [BraceletsController],
  providers: [BraceletsService],
  exports: [BraceletsService],
})
export class BraceletsModule {}
