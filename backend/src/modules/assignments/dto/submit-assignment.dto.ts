import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

/**
 * 提交作业 DTO
 */
export class SubmitAssignmentDto {
  @ApiPropertyOptional({ description: '作业内容/答案' })
  @IsOptional()
  @IsString({ message: '作业内容必须是字符串' })
  content?: string;

  @ApiPropertyOptional({ description: '附件列表（JSON 数组）' })
  @IsOptional()
  @IsArray({ message: '附件必须是数组' })
  attachments?: any[];
}
