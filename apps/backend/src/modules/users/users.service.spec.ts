import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  it('rejects updating missing app user', async () => {
    const userModel = { findByIdAndUpdate: jest.fn().mockResolvedValue(null) } as any;
    const service = new UsersService(userModel, {} as any);

    await expect(service.update('missing', { enabled: false })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('clears other default addresses when updating one address as default', async () => {
    const address = { receiver: '小念', isDefault: false, save: jest.fn().mockResolvedValue(true) } as any;
    const addressModel = {
      findOne: jest.fn().mockResolvedValue(address),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    } as any;
    const service = new UsersService({} as any, addressModel);

    await service.updateAddress('user-1', 'address-1', { receiver: '新小念', isDefault: true });

    expect(addressModel.findOne).toHaveBeenCalledWith({ _id: 'address-1', userId: 'user-1' });
    expect(addressModel.updateMany).toHaveBeenCalledWith({ userId: 'user-1', _id: { $ne: 'address-1' } }, { isDefault: false });
    expect(address.receiver).toBe('新小念');
    expect(address.isDefault).toBe(true);
    expect(address.save).toHaveBeenCalled();
  });

  it('rejects updating an address that does not belong to user', async () => {
    const addressModel = { findOne: jest.fn().mockResolvedValue(null), updateMany: jest.fn() } as any;
    const service = new UsersService({} as any, addressModel);

    await expect(service.updateAddress('user-1', 'missing', { isDefault: true })).rejects.toBeInstanceOf(NotFoundException);
    expect(addressModel.updateMany).not.toHaveBeenCalled();
  });

  it('deletes only current user address', async () => {
    const addressModel = { findOneAndDelete: jest.fn().mockResolvedValue({ _id: 'address-1' }) } as any;
    const service = new UsersService({} as any, addressModel);

    await expect(service.deleteAddress('user-1', 'address-1')).resolves.toEqual({ deleted: true });
    expect(addressModel.findOneAndDelete).toHaveBeenCalledWith({ _id: 'address-1', userId: 'user-1' });
  });
});
