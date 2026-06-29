import { PaymentsService } from './payments.service';

describe('PaymentsService refund completion', () => {
  const codeGenerator = { orderNo: jest.fn().mockReturnValue('RF_NEW') };

  it('restores deducted inventory once when refund completes', async () => {
    const refund = {
      refundNo: 'RF1',
      orderNo: 'YN1',
      status: 'pending',
      save: jest.fn(),
    };
    const order = {
      orderNo: 'YN1',
      inventoryStatus: 'deducted',
      status: 'refund_pending',
      items: [{ skuId: 'sku-1', quantity: 1 }],
      save: jest.fn(),
    };
    const refundModel = { findOne: jest.fn().mockResolvedValue(refund) } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order) } as any;
    const catalogService = { restoreDesignItems: jest.fn().mockResolvedValue([]), unlockDesignItems: jest.fn() } as any;
    const service = new PaymentsService({} as any, refundModel, orderModel, {} as any, catalogService, {} as any);

    const result = await service.completeRefund({ refundNo: 'RF1' });

    expect(result.duplicated).toBe(false);
    expect(catalogService.restoreDesignItems).toHaveBeenCalledWith(order.items, 'refund:RF1');
    expect(catalogService.unlockDesignItems).not.toHaveBeenCalled();
    expect(order.inventoryStatus).toBe('restored');
    expect(order.status).toBe('refunded');
    expect(refund.status).toBe('completed');
  });

  it('does not restore inventory twice for completed refund', async () => {
    const refund = { refundNo: 'RF1', orderNo: 'YN1', status: 'completed' };
    const order = { orderNo: 'YN1', inventoryStatus: 'restored' };
    const service = new PaymentsService(
      {} as any,
      { findOne: jest.fn().mockResolvedValue(refund) } as any,
      { findOne: jest.fn().mockResolvedValue(order) } as any,
      {} as any,
      { restoreDesignItems: jest.fn() } as any,
      {} as any,
    );

    const result = await service.completeRefund({ refundNo: 'RF1' });

    expect(result.duplicated).toBe(true);
  });

  it('rejects refund when order is not paid', async () => {
    const order = { orderNo: 'YN1', userId: 'user-1', status: 'pending_payment', totalAmount: 100 };
    const refundModel = { findOne: jest.fn(), find: jest.fn(), create: jest.fn() } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order), updateOne: jest.fn() } as any;
    const service = new PaymentsService({} as any, refundModel, orderModel, codeGenerator as any, {} as any, {} as any);

    await expect(service.createRefund({ orderNo: 'YN1', amount: 50 }, 'user-1')).rejects.toThrow('当前订单状态不可退款');
    expect(refundModel.create).not.toHaveBeenCalled();
  });

  it('rejects refund amount above order amount', async () => {
    const order = { orderNo: 'YN1', userId: 'user-1', status: 'paid', totalAmount: 100 };
    const refundModel = { findOne: jest.fn(), find: jest.fn(), create: jest.fn() } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order), updateOne: jest.fn() } as any;
    const service = new PaymentsService({} as any, refundModel, orderModel, codeGenerator as any, {} as any, {} as any);

    await expect(service.createRefund({ orderNo: 'YN1', amount: 101 }, 'user-1')).rejects.toThrow('退款金额不能超过订单金额');
    expect(refundModel.create).not.toHaveBeenCalled();
  });

  it('rejects creating another pending refund for the same order', async () => {
    const order = { orderNo: 'YN1', userId: 'user-1', status: 'paid', totalAmount: 100 };
    const refundModel = {
      findOne: jest.fn().mockResolvedValue({ refundNo: 'RF1', status: 'pending' }),
      find: jest.fn(),
      create: jest.fn(),
    } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order), updateOne: jest.fn() } as any;
    const service = new PaymentsService({} as any, refundModel, orderModel, codeGenerator as any, {} as any, {} as any);

    await expect(service.createRefund({ orderNo: 'YN1', amount: 50 }, 'user-1')).rejects.toThrow('订单已有待处理退款');
    expect(refundModel.create).not.toHaveBeenCalled();
  });

  it('rejects cumulative refund amount above order amount', async () => {
    const order = { orderNo: 'YN1', userId: 'user-1', status: 'paid', totalAmount: 100 };
    const refundModel = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([{ amount: 80, status: 'completed' }]),
      create: jest.fn(),
    } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order), updateOne: jest.fn() } as any;
    const service = new PaymentsService({} as any, refundModel, orderModel, codeGenerator as any, {} as any, {} as any);

    await expect(service.createRefund({ orderNo: 'YN1', amount: 30 }, 'user-1')).rejects.toThrow('累计退款金额不能超过订单金额');
    expect(refundModel.create).not.toHaveBeenCalled();
  });

  it('creates refund and marks order pending when safety checks pass', async () => {
    const order = { orderNo: 'YN1', userId: 'user-1', status: 'paid', totalAmount: 100 };
    const createdRefund = { refundNo: 'RF_NEW', amount: 30, status: 'pending' };
    const refundModel = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([{ amount: 20, status: 'completed' }]),
      create: jest.fn().mockResolvedValue(createdRefund),
    } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order), updateOne: jest.fn() } as any;
    const service = new PaymentsService({} as any, refundModel, orderModel, codeGenerator as any, {} as any, {} as any);

    const result = await service.createRefund({ orderNo: 'YN1', amount: 30, reason: '尺寸不合适' }, 'user-1');

    expect(result).toBe(createdRefund);
    expect(refundModel.create).toHaveBeenCalledWith({
      orderNo: 'YN1',
      refundNo: 'RF_NEW',
      amount: 30,
      reason: '尺寸不合适',
      status: 'pending',
    });
    expect(orderModel.updateOne).toHaveBeenCalledWith({ orderNo: 'YN1' }, { status: 'refund_pending' });
  });
});
