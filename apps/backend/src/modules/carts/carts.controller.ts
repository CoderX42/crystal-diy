import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AddDesignToCartDto, RemoveCartItemDto } from './carts.dto';
import { CartsService } from './carts.service';

@ApiTags('购物车')
@Controller()
export class CartsController {
  constructor(private readonly service: CartsService) {}

  @Get('admin/carts')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('cart:view')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get('app/carts/active')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  getActive(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getActive(user.sub);
  }

  @Post('app/carts/designs')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  addDesign(@CurrentUser() user: CurrentUserPayload, @Body() payload: AddDesignToCartDto) {
    return this.service.addDesign({ ...payload, userId: user.sub });
  }

  @Delete('app/carts/items')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  removeItem(@CurrentUser() user: CurrentUserPayload, @Body() payload: RemoveCartItemDto) {
    return this.service.removeItem(user.sub, payload);
  }

  @Delete('app/carts/active')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  clear(@CurrentUser() user: CurrentUserPayload) {
    return this.service.clear(user.sub);
  }
}
