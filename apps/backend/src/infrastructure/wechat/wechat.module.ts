import { Module } from '@nestjs/common';
import { WechatClientService } from './wechat-client.service';
import { WechatPayService } from './wechat-pay.service';

@Module({
  providers: [WechatClientService, WechatPayService],
  exports: [WechatClientService, WechatPayService],
})
export class WechatModule {}
