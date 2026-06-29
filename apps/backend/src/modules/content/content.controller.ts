import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditContentDto, ContentQueryDto, CreateContentEntryDto, UpdateContentEntryDto } from './content.dto';
import { ContentService } from './content.service';

@ApiTags('内容管理')
@Controller()
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get('admin/content')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('content:manage')
  list(@Query() query: ContentQueryDto) {
    return this.service.list(query);
  }

  @Post('admin/content')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('content:manage')
  create(@Body() payload: CreateContentEntryDto) {
    return this.service.create(payload);
  }

  @Patch('admin/content/:id')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('content:manage')
  update(@Param('id') id: string, @Body() payload: UpdateContentEntryDto) {
    return this.service.update(id, payload);
  }

  @Patch('admin/content/:id/audit')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('content:manage')
  audit(@Param('id') id: string, @Body() payload: AuditContentDto) {
    return this.service.audit(id, payload);
  }

  @Get('app/content')
  listPublished(@Query() query: ContentQueryDto) {
    return this.service.listPublished(query);
  }

  @Get('app/content/:id')
  getPublished(@Param('id') id: string) {
    return this.service.getPublished(id);
  }
}
