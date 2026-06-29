import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('creates or updates user from wechat code and returns token', async () => {
    const user = {
      _id: 'user-id',
      openid: 'openid-1',
      enabled: true,
      profile: { mbti: 'INFJ' },
    };
    const userModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue(user),
    } as any;
    const wechatClient = {
      code2Session: jest.fn().mockResolvedValue({ openid: 'openid-1' }),
    } as any;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as any;
    const config = {
      get: jest.fn((key: string) => (key === 'WECHAT_APP_ID' ? 'appid' : '2h')),
      getOrThrow: jest.fn(() => 'secret'),
    } as any;
    const service = new AuthService(userModel, wechatClient, jwtService, config);

    const result = await service.wechatLogin({ code: 'wx-code', profile: { mbti: 'INFJ' } });

    expect(wechatClient.code2Session).toHaveBeenCalledWith('wx-code');
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { appId: 'appid', openid: 'openid-1' },
      expect.any(Object),
      { upsert: true, new: true },
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.user.id).toBe('user-id');
  });
});
