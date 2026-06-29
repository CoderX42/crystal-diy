import { NotFoundException } from '@nestjs/common';
import { CartsService } from './carts.service';

describe('CartsService', () => {
  it('returns an empty active cart when user has no cart yet', async () => {
    const model = { findOne: jest.fn().mockResolvedValue(null) } as any;
    const service = new CartsService(model, {} as any);

    await expect(service.getActive('user-1')).resolves.toEqual({ userId: 'user-1', active: true, items: [] });
  });

  it('removes an item by design id from active cart', async () => {
    const cart = {
      userId: 'user-1',
      active: true,
      items: [{ designId: 'design-1' }, { designId: 'design-2' }],
      save: jest.fn().mockResolvedValue(true),
    } as any;
    const model = { findOne: jest.fn().mockResolvedValue(cart) } as any;
    const service = new CartsService(model, {} as any);

    await service.removeItem('user-1', { designId: 'design-1' });

    expect(cart.items).toEqual([{ designId: 'design-2' }]);
    expect(cart.save).toHaveBeenCalled();
  });

  it('rejects removing a missing cart item', async () => {
    const cart = { items: [{ designId: 'design-1' }] } as any;
    const model = { findOne: jest.fn().mockResolvedValue(cart) } as any;
    const service = new CartsService(model, {} as any);

    await expect(service.removeItem('user-1', { designId: 'missing' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('clears active cart items', async () => {
    const cart = { items: [{ designId: 'design-1' }], save: jest.fn().mockResolvedValue(true) } as any;
    const model = { findOne: jest.fn().mockResolvedValue(cart) } as any;
    const service = new CartsService(model, {} as any);

    await service.clear('user-1');

    expect(cart.items).toEqual([]);
    expect(cart.save).toHaveBeenCalled();
  });
});
