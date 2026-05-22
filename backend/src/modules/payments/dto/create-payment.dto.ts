import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * 创建缴费记录 DTO
 *
 * 缴费类型：
 * - 1: 学费
 * - 2: 教材费
 * - 3: 考试费
 * - 4: 其他
 */
export class CreatePaymentDto {
  @ApiProperty({ description: '学生 ID' })
  @IsNotEmpty({ message: '学生 ID 不能为空' })
  @IsString({ message: '学生 ID 必须是字符串' })
  studentId: string;

  @ApiProperty({ description: '缴费金额', example: 5000.0 })
  @IsNotEmpty({ message: '缴费金额不能为空' })
  @IsNumber({}, { message: '缴费金额必须是数字' })
  @Min(0.01, { message: '缴费金额必须大于 0' })
  amount: number;

  @ApiProperty({
    description: '缴费类型',
    enum: [1, 2, 3, 4],
    example: 1,
  })
  @IsNotEmpty({ message: '缴费类型不能为空' })
  @IsInt({ message: '缴费类型必须是整数' })
  @Min(1, { message: '缴费类型最小为 1' })
  @Max(4, { message: '缴费类型最大为 4' })
  type: number;

  @ApiPropertyOptional({ description: '缴费说明', example: '2024年春季学期学费' })
  @IsOptional()
  @IsString({ message: '缴费说明必须是字符串' })
  @MaxLength(500, { message: '缴费说明最多 500 个字符' })
  description?: string;

  @ApiPropertyOptional({
    description: '支付方式',
    enum: ['微信', '支付宝', '银行转账', '现金'],
    example: '微信',
  })
  @IsOptional()
  @IsString({ message: '支付方式必须是字符串' })
  @MaxLength(50, { message: '支付方式最多 50 个字符' })
  paymentMethod?: string;
}
