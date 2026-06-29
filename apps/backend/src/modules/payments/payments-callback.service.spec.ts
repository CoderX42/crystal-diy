import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService callback', () => {
  it('deducts locked inventory only once for paid callback', async () => {
    const order = {
      orderNo: 'YN1',
      totalAmount: 88,
      inventoryStatus: 'locked',
      items: [{ skuId: 'sku-1', quantity: 2 }],
      save: jest.fn(),
    };
    const orderModel = { findOne: jest.fn().mockResolvedValue(order) } as any;
    const paymentModel = {
      findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ status: 'paid' }),
      findOneAndUpdate: jest.fn().mockResolvedValue({ status: 'paid' }),
    } as any;
    const catalogService = { confirmDesignItems: jest.fn().mockResolvedValue([]) } as any;
    const service = new PaymentsService(paymentModel, {} as any, orderModel, {} as any, catalogService, {} as any);

    const first = await service.handleWechatPaid({ orderNo: 'YN1', transactionId: 'WX1', amount: 88 });
    const second = await service.handleWechatPaid({ orderNo: 'YN1', transactionId: 'WX1', amount: 88 });

    expect(first.duplicated).toBe(false);
    expect(second.duplicated).toBe(true);
    expect(catalogService.confirmDesignItems).toHaveBeenCalledTimes(1);
    expect(order.inventoryStatus).toBe('deducted');
  });

  it('rejects callback with wrong amount', async () => {
    const orderModel = { findOne: jest.fn().mockResolvedValue({ orderNo: 'YN1', totalAmount: 88 }) } as any;
    const service = new PaymentsService({} as any, {} as any, orderModel, {} as any, {} as any, {} as any);

    await expect(service.handleWechatPaid({ orderNo: 'YN1', transactionId: 'WX1', amount: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });
});
