import { createSign, createVerify, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WechatPayHeaders {
  nonce: string;
  serial: string;
  signature: string;
  timestamp: string;
}

@Injectable()
export class WechatPayService {
  constructor(private readonly config: ConfigService) {}

  buildJsapiPrepayPayload(order: { orderNo: string; totalAmount: number }, openid: string) {
    const appid = this.config.get<string>('WECHAT_APP_ID') || 'mock-appid';
    const mchid = this.config.get<string>('WECHAT_PAY_MCH_ID') || 'mock-mchid';
    const publicBaseUrl = this.config.get<string>('PUBLIC_BASE_URL', 'http://localhost:3000');
    const body = {
      appid,
      mchid,
      description: '一念一串手串订单',
      out_trade_no: order.orderNo,
      notify_url: `${publicBaseUrl}/api/app/payments/wechat/callback`,
      amount: { total: order.totalAmount, currency: 'CNY' },
      payer: { openid },
    };
    const bodyText = JSON.stringify(body);
    const signature = this.signRequest('POST', '/v3/pay/transactions/jsapi', bodyText);
    return {
      provider: 'wechat_pay_v3',
      mode: this.config.get<string>('WECHAT_PAY_MOCK', 'true') !== 'false' ? 'mock' : 'live',
      endpoint: '/v3/pay/transactions/jsapi',
      requestBody: body,
      requestSignature: signature,
    };
  }

  verifyCallback(headers: Partial<WechatPayHeaders>, rawBody: string) {
    const mockEnabled = this.config.get<string>('WECHAT_PAY_MOCK', 'true') !== 'false';
    if (mockEnabled) return true;

    const platformPublicKeyPath = this.config.get<string>('WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH');
    if (!platformPublicKeyPath) throw new UnauthorizedException('缺少微信支付平台公钥配置');
    if (!headers.timestamp || !headers.nonce || !headers.signature) throw new UnauthorizedException('微信支付签名头缺失');

    const message = `${headers.timestamp}\n${headers.nonce}\n${rawBody}\n`;
    const verifier = createVerify('RSA-SHA256');
    verifier.update(message);
    verifier.end();
    const publicKey = readFileSync(platformPublicKeyPath, 'utf8');
    const valid = verifier.verify(publicKey, headers.signature, 'base64');
    if (!valid) throw new UnauthorizedException('微信支付签名校验失败');
    return true;
  }

  signRequest(method: string, urlPath: string, body = '') {
    const privateKeyPath = this.config.get<string>('WECHAT_PAY_PRIVATE_KEY_PATH');
    const mchId = this.config.get<string>('WECHAT_PAY_MCH_ID');
    const serialNo = this.config.get<string>('WECHAT_PAY_SERIAL_NO');
    if (!privateKeyPath || !mchId || !serialNo) {
      return { authorization: 'WECHATPAY2-SHA256-RSA2048 mock-signature', nonce: 'mock', timestamp: '0' };
    }
    const nonce = randomUUID().replaceAll('-', '');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `${method.toUpperCase()}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
    const signer = createSign('RSA-SHA256');
    signer.update(message);
    signer.end();
    const privateKey = readFileSync(privateKeyPath, 'utf8');
    const signature = signer.sign(privateKey, 'base64');
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`;
    return { authorization, nonce, timestamp };
  }
}
