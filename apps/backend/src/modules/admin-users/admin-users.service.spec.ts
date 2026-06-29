import { NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  it('rejects updating missing admin user', async () => {
    const chain = { select: jest.fn().mockReturnThis(), populate: jest.fn().mockResolvedValue(null) };
    const adminModel = { findByIdAndUpdate: jest.fn().mockReturnValue(chain) } as any;
    const service = new AdminUsersService(adminModel);

    await expect(service.update('missing', { enabled: false })).rejects.toBeInstanceOf(NotFoundException);
  });
});
