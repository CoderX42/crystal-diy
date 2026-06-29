import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { CreateAdminUserDto, UpdateAdminUserDto } from './admin-users.dto';
import { AdminUser } from './admin-user.schema';

@Injectable()
export class AdminUsersService {
  constructor(@InjectModel(AdminUser.name) private readonly adminModel: Model<AdminUser>) {}

  list() {
    return this.adminModel.find().select('-passwordHash').populate('roles').sort({ createdAt: -1 });
  }

  async create(dto: CreateAdminUserDto) {
    const admin = await this.adminModel.create({
      username: dto.username,
      nickname: dto.nickname,
      passwordHash: await bcrypt.hash(dto.password, 10),
      roles: dto.roleIds.map((id) => new Types.ObjectId(id)),
      enabled: dto.enabled ?? true,
    });
    return this.adminModel.findById(admin._id).select('-passwordHash').populate('roles');
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    const payload: Record<string, unknown> = {};
    if (dto.nickname !== undefined) payload.nickname = dto.nickname;
    if (dto.enabled !== undefined) payload.enabled = dto.enabled;
    if (dto.roleIds) payload.roles = dto.roleIds.map((roleId) => new Types.ObjectId(roleId));
    if (dto.password) payload.passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = await this.adminModel.findByIdAndUpdate(id, payload, { new: true }).select('-passwordHash').populate('roles');
    if (!admin) throw new NotFoundException('管理员不存在');
    return admin;
  }
}
