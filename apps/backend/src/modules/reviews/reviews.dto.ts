import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  orderNo: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  content?: string;
}

export class AuditReviewDto {
  @IsIn(['approved', 'rejected'])
  status: string;
}
