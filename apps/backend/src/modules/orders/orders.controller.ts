import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateOrderFromCartDto, ShipOrderDto } from './orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('订单')
@Controller()
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get('admin/orders')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('order:manage')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get('app/orders')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  listMine(@CurrentUser() user: CurrentUserPayload, @Query() query: PageQueryDto) {
    return this.service.listMine(user.sub, query);
  }

  @Get('app/orders/:orderNo')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  getMine(@CurrentUser() user: CurrentUserPayload, @Param('orderNo') orderNo: string) {
    return this.service.getMine(orderNo, user.sub);
  }

  @Post('admin/orders/:orderNo/ship')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('order:manage')
  ship(@Param('orderNo') orderNo: string, @Body() payload: ShipOrderDto) {
    return this.service.ship(orderNo, payload);
  }

  @Post('app/orders/:orderNo/confirm-received')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  confirmReceived(@CurrentUser() user: CurrentUserPayload, @Param('orderNo') orderNo: string) {
    return this.service.confirmReceived(orderNo, user.sub);
  }

  @Post('app/orders/from-cart')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  createFromCart(@CurrentUser() user: CurrentUserPayload, @Body() payload: CreateOrderFromCartDto) {
    return this.service.createFromCart({ ...payload, userId: user.sub });
  }
}
