import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditReviewDto, CreateReviewDto } from './reviews.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('评价')
@Controller()
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get('admin/reviews')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('review:manage')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get('app/reviews')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  listMine(@CurrentUser() user: CurrentUserPayload, @Query() query: PageQueryDto) {
    return this.service.listMine(user.sub, query);
  }

  @Post('app/reviews')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  create(@CurrentUser() user: CurrentUserPayload, @Body() payload: CreateReviewDto) {
    return this.service.create({ ...payload, userId: user.sub }, user.sub);
  }

  @Patch('admin/reviews/:id/audit')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('review:manage')
  audit(@Param('id') id: string, @Body() payload: AuditReviewDto) {
    return this.service.audit(id, payload);
  }
}
