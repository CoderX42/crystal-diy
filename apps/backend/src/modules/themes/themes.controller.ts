import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateThemeRuleDto, MatchThemeDto, UpdateThemeRuleDto } from './themes.dto';
import { ThemesService } from './themes.service';

@ApiTags('主题推荐')
@Controller()
export class ThemesController {
  constructor(private readonly service: ThemesService) {}

  @Get('admin/themes')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('theme:manage')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Post('admin/themes')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('theme:manage')
  create(@Body() payload: CreateThemeRuleDto) {
    return this.service.create(payload);
  }

  @Patch('admin/themes/:id')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('theme:manage')
  update(@Param('id') id: string, @Body() payload: UpdateThemeRuleDto) {
    return this.service.update(id, payload);
  }

  @Post('app/themes/match')
  match(@Body() payload: MatchThemeDto) {
    return this.service.match(payload);
  }
}
