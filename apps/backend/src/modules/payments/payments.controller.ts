import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PageQueryDto } from '../../common/dto/page.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AppAuthGuard } from '../../common/guards/app-auth.guard';
import { WechatPayService } from '../../infrastructure/wechat/wechat-pay.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CompleteRefundDto, CreateRefundDto, CreateWechatPaymentDto, MarkPaymentPaidDto, WechatPayCallbackDto } from './payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('支付')
@Controller()
export class PaymentsController {
  constructor(
    private readonly service: PaymentsService,
    private readonly wechatPayService: WechatPayService,
  ) {}

  @Get('admin/payments')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('payment:view')
  list(@Query() query: PageQueryDto) {
    return this.service.list(query);
  }

  @Get('admin/refunds')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('payment:manage')
  listRefunds(@Query() query: PageQueryDto) {
    return this.service.listRefunds(query);
  }

  @Get('app/refunds')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  listMyRefunds(@CurrentUser() user: CurrentUserPayload, @Query() query: PageQueryDto) {
    return this.service.listMyRefunds(user.sub, query);
  }

  @Post('app/payments/wechat/prepay')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  createWechatPrepay(@CurrentUser() user: CurrentUserPayload, @Body() payload: CreateWechatPaymentDto) {
    return this.service.createWechatPrepay(payload, user.sub, user.openid);
  }

  @Post('app/payments/wechat/callback')
  wechatCallback(
    @Body() payload: WechatPayCallbackDto,
    @Headers('wechatpay-timestamp') timestamp?: string,
    @Headers('wechatpay-nonce') nonce?: string,
    @Headers('wechatpay-signature') signature?: string,
    @Headers('wechatpay-serial') serial?: string,
  ) {
    this.wechatPayService.verifyCallback({ timestamp: timestamp ?? '', nonce: nonce ?? '', signature: signature ?? '', serial: serial ?? '' }, JSON.stringify(payload));
    return this.service.handleWechatPaid(payload);
  }

  @Post('admin/payments/:orderNo/mark-paid')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('payment:view')
  markPaid(@Param('orderNo') orderNo: string, @Body() payload: MarkPaymentPaidDto) {
    return this.service.markPaid(orderNo, payload);
  }

  @Post('admin/refunds/complete')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('payment:view')
  completeRefund(@Body() payload: CompleteRefundDto) {
    return this.service.completeRefund(payload);
  }

  @Post('admin/refunds')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @Permissions('payment:view')
  createRefund(@Body() payload: CreateRefundDto) {
    return this.service.createRefund(payload);
  }

  @Post('app/refunds')
  @ApiBearerAuth()
  @UseGuards(AppAuthGuard)
  createMyRefund(@CurrentUser() user: CurrentUserPayload, @Body() payload: CreateRefundDto) {
    return this.service.createRefund(payload, user.sub);
  }
}
