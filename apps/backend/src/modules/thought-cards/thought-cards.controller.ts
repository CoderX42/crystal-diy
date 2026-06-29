import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  CreateThoughtCardTemplateDto,
  GenerateThoughtCardDto,
  RewriteThoughtCardDto,
  ThoughtCardTemplateQueryDto,
  UpdateThoughtCardDto,
  UpdateThoughtCardTemplateDto,
} from './thought-cards.dto';
import { ThoughtCardsService } from './thought-cards.service';

@ApiTags('念卡')
@Controller()
export class ThoughtCardsController {
  constructor(private readonly service: ThoughtCardsService) {}

  @Get('admin/thought-cards')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('thought-card:manage')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get('app/thought-cards')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  listMine(@CurrentUser() user: CurrentUserPayload, @Query() query: PageQueryDto) {
    return this.service.listMine(user.sub, query);
  }

  @Get('app/thought-cards/:id')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  getMine(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.getMine(id, user.sub);
  }


  @Patch('admin/thought-cards/:id')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('thought-card:manage')
  adminUpdate(@Param('id') id: string, @Body() payload: UpdateThoughtCardDto) {
    return this.service.update(id, payload);
  }

  @Post('admin/thought-cards/:id/rewrite')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('thought-card:manage')
  adminRewrite(@Param('id') id: string, @Body() payload: RewriteThoughtCardDto) {
    return this.service.rewrite(id, payload);
  }

  @Post('admin/thought-cards/:id/poster')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('thought-card:manage')
  adminGeneratePoster(@Param('id') id: string) {
    return this.service.generatePoster(id);
  }

  @Get('admin/thought-card-templates')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('thought-card:manage')
  listTemplates(@Query() query: ThoughtCardTemplateQueryDto) {
    return this.service.listTemplates(query);
  }

  @Get('app/thought-card-templates')
  listAppTemplates(@Query() query: ThoughtCardTemplateQueryDto) {
    return this.service.listAppTemplates(query);
  }

  @Post('admin/thought-card-templates')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('thought-card:manage')
  createTemplate(@Body() payload: CreateThoughtCardTemplateDto) {
    return this.service.createTemplate(payload);
  }

  @Patch('admin/thought-card-templates/:id')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('thought-card:manage')
  updateTemplate(@Param('id') id: string, @Body() payload: UpdateThoughtCardTemplateDto) {
    return this.service.updateTemplate(id, payload);
  }

  @Post('app/thought-cards/generate')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  generate(@CurrentUser() user: CurrentUserPayload, @Body() payload: GenerateThoughtCardDto) {
    return this.service.generate(payload, user.sub);
  }

  @Patch('app/thought-cards/:id')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  update(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string, @Body() payload: UpdateThoughtCardDto) {
    return this.service.update(id, payload, user.sub);
  }

  @Post('app/thought-cards/:id/rewrite')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  rewrite(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string, @Body() payload: RewriteThoughtCardDto) {
    return this.service.rewrite(id, payload, user.sub);
  }

  @Post('app/thought-cards/:id/poster')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  generatePoster(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.generatePoster(id, user.sub);
  }
}
