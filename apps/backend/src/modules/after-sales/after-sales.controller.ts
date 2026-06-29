import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateAfterSaleDto, HandleAfterSaleDto } from './after-sales.dto';
import { AfterSalesService } from './after-sales.service';

@ApiTags('售后')
@Controller()
export class AfterSalesController {
  constructor(private readonly service: AfterSalesService) {}

  @Get('admin/after-sales')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('after-sale:manage')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get('app/after-sales')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  listMine(@CurrentUser() user: CurrentUserPayload, @Query() query: PageQueryDto) {
    return this.service.listMine(user.sub, query);
  }

  @Post('app/after-sales')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  create(@CurrentUser() user: CurrentUserPayload, @Body() payload: CreateAfterSaleDto) {
    return this.service.create(payload, user.sub);
  }

  @Patch('admin/after-sales/:id')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('after-sale:manage')
  handle(@Param('id') id: string, @Body() payload: HandleAfterSaleDto) {
    return this.service.handle(id, payload);
  }
}
