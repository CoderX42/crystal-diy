import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUser, AdminUserSchema } from '../admin-users/admin-user.schema';
import { Role, RoleSchema } from '../rbac/role.schema';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [JwtModule.register({}), MongooseModule.forFeature([{ name: AdminUser.name, schema: AdminUserSchema }, { name: Role.name, schema: RoleSchema }])],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
})
export class AdminAuthModule {}
