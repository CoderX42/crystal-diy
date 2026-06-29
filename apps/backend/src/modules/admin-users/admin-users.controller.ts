import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateAdminUserDto, UpdateAdminUserDto } from './admin-users.dto';
import { AdminUsersService } from './admin-users.service';

@ApiTags('管理员')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @Permissions('admin:manage')
  list() {
    return this.adminUsersService.list();
  }

  @Post()
  @Permissions('admin:manage')
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.create(dto);
  }

  @Patch(':id')
  @Permissions('admin:manage')
  update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.adminUsersService.update(id, dto);
  }
}
