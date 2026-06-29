import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { WechatLoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('小程序认证')
@Controller('app/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat-login')
  wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }
}
