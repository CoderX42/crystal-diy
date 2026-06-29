import { UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';

function contextWithAuth(header?: string) {
  const request = { headers: { authorization: header } } as any;
  return {
    request,
    context: { switchToHttp: () => ({ getRequest: () => request }) } as any,
  };
}

describe('AdminAuthGuard', () => {
  it('rejects a valid token when admin has been disabled', async () => {
    const guard = new AdminAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue({ sub: 'admin-1', username: 'admin' }) } as any,
      { getOrThrow: jest.fn().mockReturnValue('secret') } as any,
      { isAdminEnabled: jest.fn().mockResolvedValue(false) } as any,
    );
    const { context } = contextWithAuth('Bearer token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('stores admin payload when token and account are valid', async () => {
    const guard = new AdminAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue({ sub: 'admin-1', username: 'admin' }) } as any,
      { getOrThrow: jest.fn().mockReturnValue('secret') } as any,
      { isAdminEnabled: jest.fn().mockResolvedValue(true) } as any,
    );
    const { context, request } = contextWithAuth('Bearer token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ sub: 'admin-1', username: 'admin' });
  });
});
