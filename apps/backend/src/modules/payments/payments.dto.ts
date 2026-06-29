import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWechatPaymentDto {
  @IsString()
  orderNo: string;
}

export class MarkPaymentPaidDto {
  @IsString()
  transactionId: string;
}

export class WechatPayCallbackDto {
  @IsString()
  orderNo: string;

  @IsString()
  transactionId: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateRefundDto {
  @IsString()
  orderNo: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CompleteRefundDto {
  @IsString()
  refundNo: string;
}
