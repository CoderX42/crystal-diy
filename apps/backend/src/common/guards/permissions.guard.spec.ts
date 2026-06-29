import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

function contextWithUser(user: Record<string, unknown>) {
  const request = { user } as any;
  return {
    request,
    context: {
      getHandler: () => 'handler',
      getClass: () => 'class',
      switchToHttp: () => ({ getRequest: () => request }),
    } as any,
  };
}

describe('PermissionsGuard', () => {
  it('uses current admin permissions instead of stale token permissions', async () => {
    const guard = new PermissionsGuard(
      { getAllAndOverride: jest.fn().mockReturnValue(['order:manage']) } as unknown as Reflector,
      { getAdminPermissions: jest.fn().mockResolvedValue(['catalog:manage']) } as any,
    );
    const { context } = contextWithUser({ sub: 'admin-1', permissions: ['order:manage'] });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows current wildcard permission', async () => {
    const guard = new PermissionsGuard(
      { getAllAndOverride: jest.fn().mockReturnValue(['order:manage']) } as unknown as Reflector,
      { getAdminPermissions: jest.fn().mockResolvedValue(['*']) } as any,
    );
    const { context } = contextWithUser({ sub: 'admin-1', permissions: [] });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
