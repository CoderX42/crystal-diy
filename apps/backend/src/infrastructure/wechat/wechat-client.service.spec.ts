import { WechatClientService } from './wechat-client.service';

describe('WechatClientService', () => {
  it('returns mock openid when wechat config is missing', async () => {
    const config = { get: jest.fn(() => '') } as any;
    const service = new WechatClientService(config);

    await expect(service.code2Session('abc')).resolves.toEqual({ openid: 'mock-openid-abc' });
  });
});
