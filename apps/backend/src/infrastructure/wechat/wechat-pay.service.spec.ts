import { UnauthorizedException } from '@nestjs/common';
import { WechatPayService } from './wechat-pay.service';

describe('WechatPayService', () => {
  it('allows callback verification in mock mode', () => {
    const service = new WechatPayService({ get: jest.fn(() => 'true') } as any);
    expect(service.verifyCallback({}, '{}')).toBe(true);
  });

  it('rejects missing platform public key when mock disabled', () => {
    const config = { get: jest.fn((key: string, fallback?: string) => (key === 'WECHAT_PAY_MOCK' ? 'false' : fallback)) } as any;
    const service = new WechatPayService(config);
    expect(() => service.verifyCallback({}, '{}')).toThrow(UnauthorizedException);
  });

  it('returns mock request signature when merchant keys are missing', () => {
    const service = new WechatPayService({ get: jest.fn(() => '') } as any);
    expect(service.signRequest('POST', '/v3/pay/transactions/jsapi', '{}').authorization).toContain('mock-signature');
  });

  it('builds jsapi prepay body and request signature', () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          WECHAT_APP_ID: 'wx-appid',
          WECHAT_PAY_MCH_ID: 'mch-1',
          PUBLIC_BASE_URL: 'https://api.example.com',
          WECHAT_PAY_MOCK: 'true',
        };
        return values[key] ?? fallback ?? '';
      }),
    } as any;
    const service = new WechatPayService(config);

    const payload = service.buildJsapiPrepayPayload({ orderNo: 'YN1', totalAmount: 128 }, 'openid-1');

    expect(payload.mode).toBe('mock');
    expect(payload.endpoint).toBe('/v3/pay/transactions/jsapi');
    expect(payload.requestBody).toMatchObject({
      appid: 'wx-appid',
      mchid: 'mch-1',
      out_trade_no: 'YN1',
      notify_url: 'https://api.example.com/api/app/payments/wechat/callback',
      amount: { total: 128, currency: 'CNY' },
      payer: { openid: 'openid-1' },
    });
    expect(payload.requestSignature.authorization).toContain('mock-signature');
  });
});
