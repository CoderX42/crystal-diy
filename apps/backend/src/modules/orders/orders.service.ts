import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { CodeGeneratorService } from '../../shared/code-generator.service';
import { Cart } from '../carts/carts.schema';
import { CatalogService } from '../catalog/catalog.service';
import { UserAddress } from '../users/user.schema';
import { CreateOrderFromCartDto, ShipOrderDto } from './orders.dto';
import { Order } from './orders.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly model: Model<Order>,
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(UserAddress.name) private readonly addressModel: Model<UserAddress>,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly catalogService: CatalogService,
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

  async getMine(orderNo: string, userId: string) {
    return this.assertOwner(orderNo, userId);
  }

  create(payload: Record<string, unknown>) {
    return this.model.create(payload);
  }

  async ship(orderNo: string, dto: ShipOrderDto) {
    const order = await this.model.findOneAndUpdate(
      { orderNo },
      { status: 'shipped', shippingInfo: { ...dto, shippedAt: new Date().toISOString() } },
      { new: true },
    );
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  async confirmReceived(orderNo: string, userId: string) {
    const existing = await this.model.findOne({ orderNo });
    if (!existing) throw new NotFoundException('订单不存在');
    if (existing.userId !== userId) throw new ForbiddenException('订单不属于当前用户');
    if (existing.status !== 'shipped') throw new BadRequestException('仅已发货订单可确认收货');
    const order = await this.model.findOneAndUpdate({ orderNo }, { status: 'completed' }, { new: true });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  async assertOwner(orderNo: string, userId: string) {
    const order = await this.model.findOne({ orderNo });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.userId !== userId) throw new ForbiddenException('订单不属于当前用户');
    return order;
  }

  async createFromCart(dto: CreateOrderFromCartDto) {
    const cart = await this.cartModel.findById(dto.cartId);
    if (!cart) throw new NotFoundException('购物车不存在');
    if (cart.userId !== dto.userId) throw new BadRequestException('购物车不属于当前用户');
    if (!cart.active || !cart.items.length) throw new BadRequestException('购物车为空或已失效');
    const address = await this.addressModel.findOne({ _id: dto.addressId, userId: dto.userId });
    if (!address) throw new NotFoundException('收货地址不存在');

    const totalAmount = cart.items.reduce((sum, item: any) => sum + Number(item.quoteSnapshot?.totalAmount ?? 0), 0);
    await this.catalogService.lockDesignItems(cart.items, `order:${dto.cartId}`);
    const order = await this.model.create({
      orderNo: this.codeGenerator.orderNo(),
      userId: dto.userId,
      items: cart.items,
      addressSnapshot: {
        receiver: address.receiver,
        phone: address.phone,
        province: address.province,
        city: address.city,
        district: address.district,
        detail: address.detail,
      },
      totalAmount,
      status: 'pending_payment',
      inventoryStatus: 'locked',
    });
    await this.cartModel.updateOne({ _id: cart._id }, { active: false });
    return order;
  }
}
