import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AccountStatusService } from '../../infrastructure/account-status/account-status.service';
import { CurrentAdminPayload } from '../decorators/current-admin.decorator';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly accountStatus: AccountStatusService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: CurrentAdminPayload }>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('请先登录');

    try {
      const user = await this.jwtService.verifyAsync<CurrentAdminPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (!(await this.accountStatus.isAdminEnabled(user.sub))) throw new UnauthorizedException('账号已被禁用');
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('登录已失效');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
