import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditBraceletDto, CreateBraceletDto } from './bracelets.dto';
import { BraceletsService } from './bracelets.service';

@ApiTags('手串册')
@Controller()
export class BraceletsController {
  constructor(private readonly service: BraceletsService) {}

  @Get('admin/bracelets')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('bracelet:manage')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get('app/bracelets')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  listMine(@CurrentUser() user: CurrentUserPayload, @Query() query: PageQueryDto) {
    return this.service.listMine(user.sub, query);
  }

  @Get('app/bracelets/:id')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  getMine(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.getMine(id, user.sub);
  }

  @Post('app/bracelets')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  create(@CurrentUser() user: CurrentUserPayload, @Body() payload: CreateBraceletDto) {
    return this.service.create({ ...payload, userId: user.sub }, user.sub);
  }

  @Patch('admin/bracelets/:id/audit')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('bracelet:manage')
  audit(@Param('id') id: string, @Body() payload: AuditBraceletDto) {
    return this.service.audit(id, payload);
  }
}
