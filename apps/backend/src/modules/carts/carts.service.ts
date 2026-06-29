import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { DesignDraft } from '../designs/designs.schema';
import { AddDesignToCartDto, RemoveCartItemDto } from './carts.dto';
import { Cart } from './carts.schema';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private readonly model: Model<Cart>,
    @InjectModel(DesignDraft.name) private readonly designModel: Model<DesignDraft>,
  ) {}

  async list(query: PageQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.model.countDocuments(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  create(payload: Record<string, unknown>) {
    return this.model.create(payload);
  }

  async getActive(userId: string) {
    const cart = await this.model.findOne({ userId, active: true });
    return cart ?? { userId, active: true, items: [] };
  }

  async addDesign(dto: AddDesignToCartDto) {
    const design = await this.designModel.findById(dto.designId);
    if (!design) throw new NotFoundException('设计不存在');
    if (design.userId !== dto.userId) throw new BadRequestException('设计不属于当前用户');
    if (design.status !== 'quoted') throw new BadRequestException('设计当前不可制作，不能加入购物车');

    const cart = await this.model.findOneAndUpdate(
      { userId: dto.userId, active: true },
      {
        userId: dto.userId,
        active: true,
        $push: {
          items: {
            designId: dto.designId,
            items: design.items,
            quoteSnapshot: design.quoteSnapshot,
            addedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true },
    );
    return cart;
  }

  async removeItem(userId: string, dto: RemoveCartItemDto) {
    const cart = await this.model.findOne({ userId, active: true });
    if (!cart) throw new NotFoundException('购物车不存在');
    const nextItems = cart.items.filter((item) => item.designId !== dto.designId);
    if (nextItems.length === cart.items.length) throw new NotFoundException('购物车项不存在');
    cart.items = nextItems;
    return cart.save();
  }

  async clear(userId: string) {
    const cart = await this.model.findOne({ userId, active: true });
    if (!cart) return { userId, active: true, items: [] };
    cart.items = [];
    return cart.save();
  }
}
