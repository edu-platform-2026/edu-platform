import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * 创建反馈 DTO
 *
 * 反馈分类：建议、投诉、表扬、其他
 */
export class CreateFeedbackDto {
  @ApiPropertyOptional({ description: '反馈标题', example: '关于课程安排的建议' })
  @IsOptional()
  @IsString({ message: '反馈标题必须是字符串' })
  @MaxLength(300, { message: '反馈标题最多 300 个字符' })
  title?: string;

  @ApiProperty({ description: '反馈内容' })
  @IsNotEmpty({ message: '反馈内容不能为空' })
  @IsString({ message: '反馈内容必须是字符串' })
  content: string;

  @ApiPropertyOptional({
    description: '反馈分类',
    enum: ['建议', '投诉', '表扬', '其他'],
    example: '建议',
  })
  @IsOptional()
  @IsString({ message: '反馈分类必须是字符串' })
  category?: string;

  @ApiPropertyOptional({ description: '相关教师 ID' })
  @IsOptional()
  @IsString({ message: '教师 ID 必须是字符串' })
  teacherId?: string;

  @ApiPropertyOptional({ description: '附件列表（JSON 数组）' })
  @IsOptional()
  attachments?: any[];
}
