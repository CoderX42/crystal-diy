import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageQueryDto } from '../../common/dto/page.dto';
import { CreateAddressDto, UpdateAddressDto, UpdateUserDto } from './users.dto';
import { User, UserAddress } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(UserAddress.name) private readonly addressModel: Model<UserAddress>,
  ) {}

  async list(query: PageQueryDto) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      this.userModel.find().sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
      this.userModel.countDocuments(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  async update(id: string, payload: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, payload, { new: true });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  listAddresses(userId: string) {
    return this.addressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  async createAddress(userId: string, payload: CreateAddressDto) {
    if (payload.isDefault) await this.addressModel.updateMany({ userId }, { isDefault: false });
    return this.addressModel.create({ ...payload, userId, isDefault: payload.isDefault ?? false });
  }

  async updateAddress(userId: string, id: string, payload: UpdateAddressDto) {
    const address = await this.addressModel.findOne({ _id: id, userId });
    if (!address) throw new NotFoundException('收货地址不存在');
    if (payload.isDefault) await this.addressModel.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
    Object.assign(address, payload);
    return address.save();
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.addressModel.findOneAndDelete({ _id: id, userId });
    if (!address) throw new NotFoundException('收货地址不存在');
    return { deleted: true };
  }
}
