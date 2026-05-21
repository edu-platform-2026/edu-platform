import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDateString,
} from 'class-validator';

/**
 * 创建上课记录 DTO
 */
export class CreateAttendanceDto {
  @ApiProperty({ description: '排课 ID' })
  @IsNotEmpty({ message: '排课 ID 不能为空' })
  @IsUUID('4', { message: '排课 ID 格式不正确' })
  scheduleId: string;

  @ApiProperty({ description: '课程 ID' })
  @IsNotEmpty({ message: '课程 ID 不能为空' })
  @IsUUID('4', { message: '课程 ID 格式不正确' })
  courseId: string;

  @ApiProperty({ description: '实际上课日期', example: '2024-09-02' })
  @IsNotEmpty({ message: '上课日期不能为空' })
  @IsDateString({}, { message: '日期格式不正确' })
  actualDate: string;

  @ApiPropertyOptional({ description: '实际上课时间', example: '08:00' })
  @IsOptional()
  @IsString({ message: '上课时间必须是字符串' })
  startTime?: string;

  @ApiPropertyOptional({ description: '实际下课时间', example: '09:30' })
  @IsOptional()
  @IsString({ message: '下课时间必须是字符串' })
  endTime?: string;

  @ApiPropertyOptional({
    description: '上课状态',
    enum: [1, 2, 3],
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: '状态必须是整数' })
  @Min(1, { message: '状态最小为 1' })
  @Max(3, { message: '状态最大为 3' })
  status?: number;

  @ApiPropertyOptional({ description: '上课反馈/备注' })
  @IsOptional()
  @IsString({ message: '反馈必须是字符串' })
  feedback?: string;
}
