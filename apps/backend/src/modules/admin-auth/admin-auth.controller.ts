import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin, CurrentAdminPayload } from '../../common/decorators/current-admin.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminLoginDto } from './admin-login.dto';
import { AdminAuthService } from './admin-auth.service';

@ApiTags('管理后台认证')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  me(@CurrentAdmin() admin: CurrentAdminPayload) {
    return admin;
  }
}
