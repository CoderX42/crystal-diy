import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService ownership', () => {
  it('rejects confirm received for non-owner', async () => {
    const orderModel = {
      findOne: jest.fn().mockResolvedValue({ orderNo: 'YN1', userId: 'owner' }),
      findOneAndUpdate: jest.fn(),
    } as any;
    const service = new OrdersService(orderModel, {} as any, {} as any, {} as any, {} as any);

    await expect(service.confirmReceived('YN1', 'other')).rejects.toBeInstanceOf(ForbiddenException);
    expect(orderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects confirm received before shipment', async () => {
    const orderModel = {
      findOne: jest.fn().mockResolvedValue({ orderNo: 'YN1', userId: 'owner', status: 'paid' }),
      findOneAndUpdate: jest.fn(),
    } as any;
    const service = new OrdersService(orderModel, {} as any, {} as any, {} as any, {} as any);

    await expect(service.confirmReceived('YN1', 'owner')).rejects.toBeInstanceOf(BadRequestException);
    expect(orderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('lists only current user orders', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ orderNo: 'YN1', userId: 'owner' }]),
    };
    const orderModel = {
      find: jest.fn().mockReturnValue(chain),
      countDocuments: jest.fn().mockResolvedValue(1),
    } as any;
    const service = new OrdersService(orderModel, {} as any, {} as any, {} as any, {} as any);

    const result = await service.listMine('owner', { page: 1, pageSize: 20 });

    expect(orderModel.find).toHaveBeenCalledWith({ userId: 'owner' });
    expect(orderModel.countDocuments).toHaveBeenCalledWith({ userId: 'owner' });
    expect(result.total).toBe(1);
  });

  it('rejects creating order when address does not belong to user', async () => {
    const cart = { _id: 'cart-1', userId: 'user-1', active: true, items: [{ quoteSnapshot: { totalAmount: 20 } }] };
    const orderModel = { create: jest.fn() } as any;
    const cartModel = { findById: jest.fn().mockResolvedValue(cart), updateOne: jest.fn() } as any;
    const addressModel = { findOne: jest.fn().mockResolvedValue(null) } as any;
    const service = new OrdersService(orderModel, cartModel, addressModel, {} as any, {} as any);

    await expect(service.createFromCart({ cartId: 'cart-1', userId: 'user-1', addressId: 'address-1' })).rejects.toThrow('收货地址不存在');
    expect(orderModel.create).not.toHaveBeenCalled();
  });
});
