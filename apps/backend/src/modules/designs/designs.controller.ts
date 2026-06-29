import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DesignsService } from './designs.service';
import { QuoteDesignDto, ReorderDesignDraftDto, SaveDesignDraftDto } from './designs.dto';

@ApiTags('DIY设计')
@Controller()
export class DesignsController {
  constructor(private readonly service: DesignsService) {}

  @Get('admin/designs')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('design:view')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get('app/designs')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  listMine(@CurrentUser() user: CurrentUserPayload, @Query() query: PageQueryDto) {
    return this.service.listMine(user.sub, query);
  }

  @Get('app/designs/:id')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  getMine(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.getMine(id, user.sub);
  }

  @Post('app/designs')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  saveDraft(@CurrentUser() user: CurrentUserPayload, @Body() payload: SaveDesignDraftDto) {
    return this.service.saveDraft({ ...payload, userId: user.sub });
  }

  @Patch('app/designs/:id/reorder')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  reorder(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string, @Body() payload: ReorderDesignDraftDto) {
    return this.service.reorder(id, payload, user.sub);
  }

  @Post('app/designs/quote')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  quote(@CurrentUser() user: CurrentUserPayload, @Body() payload: QuoteDesignDto) {
    return this.service.quote({ ...payload, userId: user.sub });
  }
}
