import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { Role } from '../rbac/role.schema';
import { SYSTEM_PERMISSIONS } from '../rbac/rbac.constants';
import { AdminUser } from '../admin-users/admin-user.schema';
import { AdminLoginDto } from './admin-login.dto';

@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(
    @InjectModel(AdminUser.name) private readonly adminModel: Model<AdminUser>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const role = await this.roleModel.findOneAndUpdate(
      { code: 'super_admin' },
      { code: 'super_admin', name: '超级管理员', permissions: ['*'], enabled: true },
      { upsert: true, new: true },
    );
    const username = this.config.get<string>('ADMIN_DEFAULT_USERNAME', 'admin');
    const exists = await this.adminModel.exists({ username });
    if (!exists) {
      const password = this.config.get<string>('ADMIN_DEFAULT_PASSWORD', 'Admin@123456');
      await this.adminModel.create({
        username,
        nickname: '系统管理员',
        passwordHash: await bcrypt.hash(password, 10),
        roles: [role._id],
        enabled: true,
      });
    }
  }

  async login(dto: AdminLoginDto) {
    const admin = await this.adminModel.findOne({ username: dto.username }).populate<{ roles: Role[] }>('roles');
    if (!admin || !admin.enabled) throw new UnauthorizedException('账号或密码错误');
    const passwordMatched = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordMatched) throw new UnauthorizedException('账号或密码错误');

    const roles = admin.roles.filter((role) => role.enabled).map((role) => role.code);
    const permissions = Array.from(
      new Set(admin.roles.filter((role) => role.enabled).flatMap((role) => role.permissions)),
    );
    const payload = { sub: String(admin._id), username: admin.username, roles, permissions };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '2h') as any,
    });
    await this.adminModel.updateOne({ _id: admin._id }, { lastLoginAt: new Date() });

    return {
      accessToken,
      tokenType: 'Bearer',
      permissions,
      allPermissions: SYSTEM_PERMISSIONS,
      admin: {
        id: String(admin._id),
        username: admin.username,
        nickname: admin.nickname,
        roles,
      },
    };
  }
}
