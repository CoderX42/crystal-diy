import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WechatSessionResult {
  openid: string;
  session_key?: string;
  unionid?: string;
}

@Injectable()
export class WechatClientService {
  constructor(private readonly config: ConfigService) {}

  async code2Session(code: string): Promise<WechatSessionResult> {
    const appid = this.config.get<string>('WECHAT_APP_ID');
    const secret = this.config.get<string>('WECHAT_APP_SECRET');
    if (!appid || !secret) {
      return { openid: `mock-openid-${code}` };
    }

    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.searchParams.set('appid', appid);
    url.searchParams.set('secret', secret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    const response = await fetch(url);
    const data = (await response.json()) as WechatSessionResult & { errcode?: number; errmsg?: string };
    if (data.errcode) throw new ServiceUnavailableException(`微信登录失败：${data.errmsg ?? data.errcode}`);
    return data;
  }
}
