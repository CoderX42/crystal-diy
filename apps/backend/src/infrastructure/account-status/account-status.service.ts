import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminUser } from '../../modules/admin-users/admin-user.schema';
import { Role } from '../../modules/rbac/role.schema';
import { User } from '../../modules/users/user.schema';

@Injectable()
export class AccountStatusService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(AdminUser.name) private readonly adminModel: Model<AdminUser>,
  ) {}

  async isAppUserEnabled(id: string) {
    const user = await this.userModel.findById(id).select('enabled');
    return Boolean(user?.enabled);
  }

  async isAdminEnabled(id: string) {
    const admin = await this.adminModel.findById(id).select('enabled');
    return Boolean(admin?.enabled);
  }

  async getAdminPermissions(id: string) {
    const admin = await this.adminModel.findById(id).select('enabled roles').populate<{ roles: Role[] }>('roles');
    if (!admin?.enabled) return [];
    return Array.from(
      new Set(admin.roles.filter((role) => role.enabled).flatMap((role) => role.permissions)),
    );
  }
}
