import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountStatusService } from '../../infrastructure/account-status/account-status.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accountStatus: AccountStatusService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: { permissions?: string[]; sub?: string } }>();
    const owned = request.user?.sub
      ? await this.accountStatus.getAdminPermissions(request.user.sub)
      : request.user?.permissions ?? [];
    if (required.every((permission) => owned.includes(permission) || owned.includes('*'))) return true;
    throw new ForbiddenException('缺少操作权限');
  }
}
