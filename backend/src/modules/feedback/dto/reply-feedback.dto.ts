import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * 回复反馈 DTO
 */
export class ReplyFeedbackDto {
  @ApiProperty({ description: '回复内容' })
  @IsNotEmpty({ message: '回复内容不能为空' })
  @IsString({ message: '回复内容必须是字符串' })
  content: string;

  @ApiPropertyOptional({
    description: '更新反馈状态',
    enum: [2, 3, 4],
  })
  @IsOptional()
  @IsInt({ message: '状态必须是整数' })
  @Min(2, { message: '状态最小为 2' })
  @Max(4, { message: '状态最大为 4' })
  status?: number;
}
