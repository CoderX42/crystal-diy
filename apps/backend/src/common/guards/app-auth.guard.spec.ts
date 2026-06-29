import { UnauthorizedException } from '@nestjs/common';
import { AppAuthGuard } from './app-auth.guard';

function contextWithAuth(header?: string) {
  const request = { headers: { authorization: header } } as any;
  return {
    request,
    context: { switchToHttp: () => ({ getRequest: () => request }) } as any,
  };
}

describe('AppAuthGuard', () => {
  it('rejects a valid token when app user has been disabled', async () => {
    const guard = new AppAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', openid: 'openid' }) } as any,
      { getOrThrow: jest.fn().mockReturnValue('secret') } as any,
      { isAppUserEnabled: jest.fn().mockResolvedValue(false) } as any,
    );
    const { context } = contextWithAuth('Bearer token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('stores user payload when token and account are valid', async () => {
    const guard = new AppAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', openid: 'openid' }) } as any,
      { getOrThrow: jest.fn().mockReturnValue('secret') } as any,
      { isAppUserEnabled: jest.fn().mockResolvedValue(true) } as any,
    );
    const { context, request } = contextWithAuth('Bearer token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ sub: 'user-1', openid: 'openid' });
  });
});
