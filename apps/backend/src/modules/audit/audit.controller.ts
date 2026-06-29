import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from './audit.service';

@ApiTags('审计日志')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Permissions('audit:view')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('audit:view')
  create(@Body() payload: Record<string, unknown>) {
    return this.service.create(payload);
  }
}
