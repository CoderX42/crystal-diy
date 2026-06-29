import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateRoleDto, UpdateRoleDto } from './rbac.dto';
import { RbacService } from './rbac.service';

@ApiTags('角色权限')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @Permissions('rbac:manage')
  permissions() {
    return this.rbacService.permissions();
  }

  @Get('roles')
  @Permissions('rbac:manage')
  roles() {
    return this.rbacService.listRoles();
  }

  @Post('roles')
  @Permissions('rbac:manage')
  create(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Patch('roles/:id')
  @Permissions('rbac:manage')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(id, dto);
  }
}
