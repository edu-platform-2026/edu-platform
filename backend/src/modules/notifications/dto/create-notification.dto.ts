import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsArray,
  IsDateString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * 创建通知 DTO
 *
 * 通知类型：
 * - 1: 系统通知
 * - 2: 作业通知
 * - 3: 课程通知
 * - 4: 考勤通知
 * - 5: 一般通知
 */
export class CreateNotificationDto {
  @ApiProperty({ description: '通知标题', example: '期中考试安排通知' })
  @IsNotEmpty({ message: '通知标题不能为空' })
  @IsString({ message: '通知标题必须是字符串' })
  @MaxLength(300, { message: '通知标题最多 300 个字符' })
  title: string;

  @ApiProperty({ description: '通知内容' })
  @IsNotEmpty({ message: '通知内容不能为空' })
  @IsString({ message: '通知内容必须是字符串' })
  content: string;

  @ApiProperty({
    description: '通知类型',
    enum: [1, 2, 3, 4, 5],
    example: 5,
  })
  @IsNotEmpty({ message: '通知类型不能为空' })
  @IsInt({ message: '通知类型必须是整数' })
  @Min(1, { message: '通知类型最小为 1' })
  @Max(5, { message: '通知类型最大为 5' })
  type: number;

  @ApiPropertyOptional({
    description: '目标角色（按角色推送）',
    example: 'TEACHER',
  })
  @IsOptional()
  @IsString({ message: '目标角色必须是字符串' })
  @MaxLength(50, { message: '目标角色最多 50 个字符' })
  targetRole?: string;

  @ApiPropertyOptional({
    description: '目标用户 ID 列表（按用户推送）',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: '目标用户必须是数组' })
  targetUsers?: string[];

  @ApiPropertyOptional({ description: '附件列表（JSON 数组）' })
  @IsOptional()
  @IsArray({ message: '附件必须是数组' })
  attachments?: any[];

  @ApiPropertyOptional({ description: '是否紧急通知', default: false })
  @IsOptional()
  @IsBoolean({ message: '是否紧急必须是布尔值' })
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: '发布时间（不填则立即发布）' })
  @IsOptional()
  @IsDateString({}, { message: '日期格式不正确' })
  publishedAt?: string;
}
