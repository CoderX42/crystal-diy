import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WechatClientService } from '../../infrastructure/wechat/wechat-client.service';
import { User } from '../users/user.schema';
import { WechatLoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly wechatClient: WechatClientService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async wechatLogin(dto: WechatLoginDto) {
    const appId = this.config.get<string>('WECHAT_APP_ID') || 'mock-appid';
    const session = await this.wechatClient.code2Session(dto.code);
    const user = await this.userModel.findOneAndUpdate(
      { appId, openid: session.openid },
      {
        $setOnInsert: { appId, openid: session.openid, enabled: true },
        $set: {
          unionid: session.unionid,
          profile: dto.profile ?? {},
          lastLoginAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    if (!user.enabled) throw new UnauthorizedException('账号已被禁用');
    const payload = { sub: String(user._id), openid: user.openid };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '2h') as any,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: String(user._id),
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        profile: user.profile,
      },
    };
  }
}
