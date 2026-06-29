import { ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService ownership', () => {
  const wechatPayService = {
    buildJsapiPrepayPayload: jest.fn().mockReturnValue({ provider: 'wechat_pay_v3', requestSignature: { authorization: 'mock' } }),
  };

  it('rejects prepay for non-owner order', async () => {
    const orderModel = { findOne: jest.fn().mockResolvedValue({ orderNo: 'YN1', userId: 'owner' }) } as any;
    const paymentModel = { findOneAndUpdate: jest.fn() } as any;
    const service = new PaymentsService(paymentModel, {} as any, orderModel, {} as any, {} as any, wechatPayService as any);

    await expect(service.createWechatPrepay({ orderNo: 'YN1' }, 'other')).rejects.toBeInstanceOf(ForbiddenException);
    expect(paymentModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('builds jsapi prepay payload with order amount and openid', async () => {
    const order = { orderNo: 'YN1', userId: 'owner', totalAmount: 128 };
    const prepayPayload = { provider: 'wechat_pay_v3', endpoint: '/v3/pay/transactions/jsapi' };
    const payment = { orderNo: 'YN1', amount: 128, prepayPayload };
    const paymentModel = { findOneAndUpdate: jest.fn().mockResolvedValue(payment) } as any;
    const orderModel = { findOne: jest.fn().mockResolvedValue(order) } as any;
    const payService = { buildJsapiPrepayPayload: jest.fn().mockReturnValue(prepayPayload) };
    const service = new PaymentsService(paymentModel, {} as any, orderModel, {} as any, {} as any, payService as any);

    const result = await service.createWechatPrepay({ orderNo: 'YN1' }, 'owner', 'openid-1');

    expect(result).toBe(payment);
    expect(payService.buildJsapiPrepayPayload).toHaveBeenCalledWith({ orderNo: 'YN1', totalAmount: 128 }, 'openid-1');
    expect(paymentModel.findOneAndUpdate).toHaveBeenCalledWith(
      { orderNo: 'YN1', channel: 'wechat' },
      { orderNo: 'YN1', channel: 'wechat', status: 'pending', amount: 128, prepayPayload },
      { upsert: true, new: true },
    );
  });
});
