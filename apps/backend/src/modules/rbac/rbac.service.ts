import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoleDto, UpdateRoleDto } from './rbac.dto';
import { Role } from './role.schema';
import { SYSTEM_PERMISSIONS } from './rbac.constants';

@Injectable()
export class RbacService {
  constructor(@InjectModel(Role.name) private readonly roleModel: Model<Role>) {}

  permissions() {
    return SYSTEM_PERMISSIONS;
  }

  listRoles() {
    return this.roleModel.find().sort({ createdAt: -1 });
  }

  createRole(dto: CreateRoleDto) {
    return this.roleModel.create(dto);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.roleModel.findByIdAndUpdate(id, dto, { new: true });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }
}
