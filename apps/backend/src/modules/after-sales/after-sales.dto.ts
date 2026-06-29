import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAfterSaleDto {
  @IsString()
  orderNo: string;

  @IsIn(['refund', 'return', 'exchange'])
  type: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class HandleAfterSaleDto {
  @IsIn(['approved', 'rejected', 'completed'])
  status: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
