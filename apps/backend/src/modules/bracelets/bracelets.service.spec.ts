import { ForbiddenException } from '@nestjs/common';
import { BraceletsService } from './bracelets.service';

describe('BraceletsService', () => {
  it('rejects creating bracelet before order is completed', async () => {
    const model = { create: jest.fn() } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue({ orderNo: 'YN1', userId: 'user-1', status: 'paid' }) } as any;
    const service = new BraceletsService(model, orderModel);

    await expect(
      service.create({ orderNo: 'YN1', userId: 'user-1', name: '晨光手串', images: [] }, 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('lists only current user bracelets', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ name: '晨光手串', userId: 'user-1' }]),
    };
    const model = {
      find: jest.fn().mockReturnValue(chain),
      countDocuments: jest.fn().mockResolvedValue(1),
    } as any;
    const service = new BraceletsService(model, {} as any);

    const result = await service.listMine('user-1', { page: 1, pageSize: 20 });

    expect(model.find).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(model.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(result.total).toBe(1);
  });
});
