import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUser, AdminUserSchema } from '../../modules/admin-users/admin-user.schema';
import { Role, RoleSchema } from '../../modules/rbac/role.schema';
import { User, UserSchema } from '../../modules/users/user.schema';
import { AccountStatusService } from './account-status.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  providers: [AccountStatusService],
  exports: [AccountStatusService],
})
export class AccountStatusModule {}
