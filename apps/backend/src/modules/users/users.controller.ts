import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateAddressDto, UpdateAddressDto, UpdateUserDto } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('用户中心')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/app-users')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('user:manage')
  list(@Query() query: PageQueryDto) {
    return this.usersService.list(query);
  }

  @Patch('admin/app-users/:id')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('user:manage')
  update(@Param('id') id: string, @Body() payload: UpdateUserDto) {
    return this.usersService.update(id, payload);
  }

  @Get('app/users/me')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  me(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.findById(user.sub);
  }

  @Get('app/users/me/addresses')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  addresses(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.listAddresses(user.sub);
  }

  @Post('app/users/me/addresses')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  createAddress(@CurrentUser() user: CurrentUserPayload, @Body() payload: CreateAddressDto) {
    return this.usersService.createAddress(user.sub, payload);
  }

  @Patch('app/users/me/addresses/:id')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  updateAddress(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string, @Body() payload: UpdateAddressDto) {
    return this.usersService.updateAddress(user.sub, id, payload);
  }

  @Delete('app/users/me/addresses/:id')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  deleteAddress(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.sub, id);
  }
}
