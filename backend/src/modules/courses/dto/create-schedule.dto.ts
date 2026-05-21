import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsUUID,
  IsDateString,
} from 'class-validator';

/**
 * 创建排课 DTO
 */
export class CreateScheduleDto {
  @ApiProperty({ description: '课程 ID' })
  @IsNotEmpty({ message: '课程 ID 不能为空' })
  @IsUUID('4', { message: '课程 ID 格式不正确' })
  courseId: string;

  @ApiProperty({ description: '星期几（1-7，1 代表周一）', example: 1, minimum: 1, maximum: 7 })
  @IsNotEmpty({ message: '星期不能为空' })
  @IsInt({ message: '星期必须是整数' })
  @Min(1, { message: '星期最小为 1' })
  @Max(7, { message: '星期最大为 7' })
  dayOfWeek: number;

  @ApiProperty({ description: '上课时间', example: '08:00' })
  @IsNotEmpty({ message: '上课时间不能为空' })
  @IsString({ message: '上课时间必须是字符串' })
  startTime: string;

  @ApiProperty({ description: '下课时间', example: '09:30' })
  @IsNotEmpty({ message: '下课时间不能为空' })
  @IsString({ message: '下课时间必须是字符串' })
  endTime: string;

  @ApiPropertyOptional({ description: '教室', example: 'A201' })
  @IsOptional()
  @IsString({ message: '教室必须是字符串' })
  @MaxLength(100, { message: '教室最多 100 个字符' })
  room?: string;

  @ApiProperty({ description: '生效开始日期', example: '2024-09-01' })
  @IsNotEmpty({ message: '生效开始日期不能为空' })
  @IsDateString({}, { message: '日期格式不正确' })
  effectiveFrom: string;

  @ApiPropertyOptional({ description: '生效结束日期', example: '2025-01-31' })
  @IsOptional()
  @IsDateString({}, { message: '日期格式不正确' })
  effectiveUntil?: string;
}
