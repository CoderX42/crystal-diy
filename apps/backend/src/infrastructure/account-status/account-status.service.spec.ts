import { AccountStatusService } from './account-status.service';

describe('AccountStatusService', () => {
  it('returns false for missing app users', async () => {
    const chain = { select: jest.fn().mockResolvedValue(null) };
    const service = new AccountStatusService({ findById: jest.fn().mockReturnValue(chain) } as any, {} as any);

    await expect(service.isAppUserEnabled('missing')).resolves.toBe(false);
  });

  it('returns true for enabled admins', async () => {
    const chain = { select: jest.fn().mockResolvedValue({ enabled: true }) };
    const service = new AccountStatusService({} as any, { findById: jest.fn().mockReturnValue(chain) } as any);

    await expect(service.isAdminEnabled('admin-1')).resolves.toBe(true);
  });

  it('returns permissions from currently enabled roles', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue({
        enabled: true,
        roles: [
          { enabled: true, permissions: ['order:manage', 'catalog:manage'] },
          { enabled: false, permissions: ['admin:manage'] },
          { enabled: true, permissions: ['order:manage'] },
        ],
      }),
    };
    const service = new AccountStatusService({} as any, { findById: jest.fn().mockReturnValue(chain) } as any);

    await expect(service.getAdminPermissions('admin-1')).resolves.toEqual(['order:manage', 'catalog:manage']);
  });
});
