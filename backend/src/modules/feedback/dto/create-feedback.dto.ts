import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * 创建反馈 DTO
 *
 * 反馈类型：
 * - 1: 建议
 * - 2: 投诉
 * - 3: 问题反馈
 * - 4: 其他
 *
 * 反馈状态：
 * - 1: 待处理
 * - 2: 处理中
 * - 3: 已回复
 * - 4: 已关闭
 */
export class CreateFeedbackDto {
  @ApiProperty({ description: '反馈标题', example: '关于课程安排的建议' })
  @IsNotEmpty({ message: '反馈标题不能为空' })
  @IsString({ message: '反馈标题必须是字符串' })
  @MaxLength(300, { message: '反馈标题最多 300 个字符' })
  title: string;

  @ApiProperty({ description: '反馈内容' })
  @IsNotEmpty({ message: '反馈内容不能为空' })
  @IsString({ message: '反馈内容必须是字符串' })
  content: string;

  @ApiProperty({
    description: '反馈类型',
    enum: [1, 2, 3, 4],
    example: 1,
  })
  @IsNotEmpty({ message: '反馈类型不能为空' })
  @IsInt({ message: '反馈类型必须是整数' })
  @Min(1, { message: '反馈类型最小为 1' })
  @Max(4, { message: '反馈类型最大为 4' })
  type: number;

  @ApiPropertyOptional({ description: '附件列表（JSON 数组）' })
  @IsOptional()
  attachments?: any[];
}
