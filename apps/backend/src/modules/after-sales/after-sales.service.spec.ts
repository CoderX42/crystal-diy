import { BadRequestException } from '@nestjs/common';
import { AfterSalesService } from './after-sales.service';

describe('AfterSalesService', () => {
  const codeGenerator = { orderNo: jest.fn().mockReturnValue('RF_NEW') };

  it('rejects after-sale request before order is paid', async () => {
    const order = { orderNo: 'YN1', userId: 'user-1', status: 'pending_payment' };
    const model = { findOne: jest.fn(), create: jest.fn() } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order), updateOne: jest.fn() } as any;
    const service = new AfterSalesService(model, orderModel, {} as any, codeGenerator as any);

    await expect(service.create({ orderNo: 'YN1', type: 'refund' }, 'user-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate pending after-sale for the same order', async () => {
    const order = { orderNo: 'YN1', userId: 'user-1', status: 'paid' };
    const model = { findOne: jest.fn().mockResolvedValue({ orderNo: 'YN1', status: 'pending' }), create: jest.fn() } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order), updateOne: jest.fn() } as any;
    const service = new AfterSalesService(model, orderModel, {} as any, codeGenerator as any);

    await expect(service.create({ orderNo: 'YN1', type: 'refund' }, 'user-1')).rejects.toThrow('订单已有待处理售后');
    expect(model.create).not.toHaveBeenCalled();
  });

  it('creates refund and marks order refund pending when refund after-sale is approved', async () => {
    const afterSale: any = {
      orderNo: 'YN1',
      type: 'refund',
      status: 'pending',
      reason: '不喜欢',
      save: jest.fn(),
    };
    const order = { orderNo: 'YN1', totalAmount: 168, status: 'after_sale_pending', save: jest.fn() };
    const refundModel = { create: jest.fn().mockResolvedValue({ refundNo: 'RF_NEW' }) } as any;
    const model = { findById: jest.fn().mockResolvedValue(afterSale) } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order) } as any;
    const service = new AfterSalesService(model, orderModel, refundModel, codeGenerator as any);

    const result = await service.handle('as-1', { status: 'approved', remark: '同意退款' });

    expect(result).toBe(afterSale);
    expect(refundModel.create).toHaveBeenCalledWith({
      orderNo: 'YN1',
      refundNo: 'RF_NEW',
      amount: 168,
      reason: '不喜欢',
      status: 'pending',
    });
    expect(afterSale.status).toBe('approved');
    expect(afterSale.remark).toBe('同意退款');
    expect(afterSale.refundNo).toBe('RF_NEW');
    expect(order.status).toBe('refund_pending');
    expect(order.save).toHaveBeenCalled();
    expect(afterSale.save).toHaveBeenCalled();
  });

  it('does not create another refund when approved refund after-sale already has refundNo', async () => {
    const afterSale: any = {
      orderNo: 'YN1',
      type: 'refund',
      status: 'approved',
      refundNo: 'RF_EXISTING',
      save: jest.fn(),
    };
    const order = { orderNo: 'YN1', totalAmount: 168, status: 'refund_pending', save: jest.fn() };
    const refundModel = { create: jest.fn() } as any;
    const model = { findById: jest.fn().mockResolvedValue(afterSale) } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order) } as any;
    const service = new AfterSalesService(model, orderModel, refundModel, codeGenerator as any);

    await service.handle('as-1', { status: 'approved' });

    expect(refundModel.create).not.toHaveBeenCalled();
    expect(afterSale.refundNo).toBe('RF_EXISTING');
  });

  it('restores paid order status when after-sale is rejected', async () => {
    const afterSale: any = { orderNo: 'YN1', type: 'exchange', status: 'pending', save: jest.fn() };
    const order = { orderNo: 'YN1', status: 'after_sale_pending', save: jest.fn() };
    const model = { findById: jest.fn().mockResolvedValue(afterSale) } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order) } as any;
    const service = new AfterSalesService(model, orderModel, {} as any, codeGenerator as any);

    await service.handle('as-1', { status: 'rejected', remark: '凭证不足' });

    expect(afterSale.status).toBe('rejected');
    expect(afterSale.remark).toBe('凭证不足');
    expect(order.status).toBe('paid');
  });
});
