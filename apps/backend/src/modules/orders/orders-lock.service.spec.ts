import { OrdersService } from './orders.service';

describe('OrdersService inventory lock', () => {
  it('locks cart items before creating order', async () => {
    const cart = {
      _id: 'cart-1',
      userId: 'user-1',
      active: true,
      items: [{ quoteSnapshot: { totalAmount: 20 }, items: [{ skuId: 'sku-1', quantity: 1 }] }],
    };
    const orderModel = { create: jest.fn().mockResolvedValue({ orderNo: 'YN1' }) } as any;
    const cartModel = { findById: jest.fn().mockResolvedValue(cart), updateOne: jest.fn() } as any;
    const address = { receiver: '小念', phone: '13800000000', province: '浙江省', city: '杭州市', district: '西湖区', detail: '灵隐路 1 号' };
    const addressModel = { findOne: jest.fn().mockResolvedValue(address) } as any;
    const codeGenerator = { orderNo: jest.fn().mockReturnValue('YN1') } as any;
    const catalogService = { lockDesignItems: jest.fn().mockResolvedValue([]) } as any;
    const service = new OrdersService(orderModel, cartModel, addressModel, codeGenerator, catalogService);

    await service.createFromCart({ cartId: 'cart-1', userId: 'user-1', addressId: 'address-1' });

    expect(addressModel.findOne).toHaveBeenCalledWith({ _id: 'address-1', userId: 'user-1' });
    expect(catalogService.lockDesignItems).toHaveBeenCalledWith(cart.items, 'order:cart-1');
    expect(orderModel.create).toHaveBeenCalledWith(expect.objectContaining({ inventoryStatus: 'locked', addressSnapshot: address }));
  });
});
