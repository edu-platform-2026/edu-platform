import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * 批改作业 DTO
 */
export class GradeSubmissionDto {
  @ApiProperty({ description: '得分', example: 85 })
  @IsNotEmpty({ message: '得分不能为空' })
  @IsNumber({}, { message: '得分必须是数字' })
  @Min(0, { message: '得分不能为负数' })
  score: number;

  @ApiPropertyOptional({ description: '等级', example: 'B+' })
  @IsOptional()
  @IsString({ message: '等级必须是字符串' })
  @MaxLength(20, { message: '等级最多 20 个字符' })
  grade?: string;

  @ApiPropertyOptional({ description: '教师评语' })
  @IsOptional()
  @IsString({ message: '评语必须是字符串' })
  comment?: string;
}
