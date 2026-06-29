import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { DesignDraft, DesignDraftSchema } from '../designs/designs.schema';
import { Cart, CartSchema } from './carts.schema';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: DesignDraft.name, schema: DesignDraftSchema },
    ]),
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
