import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * 更新缴费记录 DTO
 */
export class UpdatePaymentDto {
  @ApiPropertyOptional({ description: '缴费金额', example: 5000.0 })
  @IsOptional()
  @IsNumber({}, { message: '缴费金额必须是数字' })
  @Min(0.01, { message: '缴费金额必须大于 0' })
  amount?: number;

  @ApiPropertyOptional({
    description: '缴费类型',
    enum: [1, 2, 3, 4],
  })
  @IsOptional()
  @IsInt({ message: '缴费类型必须是整数' })
  @Min(1, { message: '缴费类型最小为 1' })
  @Max(4, { message: '缴费类型最大为 4' })
  type?: number;

  @ApiPropertyOptional({
    description: '缴费状态',
    enum: [1, 2, 3],
  })
  @IsOptional()
  @IsInt({ message: '缴费状态必须是整数' })
  @Min(1, { message: '缴费状态最小为 1' })
  @Max(3, { message: '缴费状态最大为 3' })
  status?: number;

  @ApiPropertyOptional({ description: '缴费说明' })
  @IsOptional()
  @IsString({ message: '缴费说明必须是字符串' })
  @MaxLength(500, { message: '缴费说明最多 500 个字符' })
  description?: string;

  @ApiPropertyOptional({ description: '支付方式' })
  @IsOptional()
  @IsString({ message: '支付方式必须是字符串' })
  @MaxLength(50, { message: '支付方式最多 50 个字符' })
  paymentMethod?: string;
}
