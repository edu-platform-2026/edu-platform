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
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';

/**
 * 创建作业 DTO
 */
export class CreateAssignmentDto {
  @ApiProperty({ description: '作业标题', example: '第一章课后练习' })
  @IsNotEmpty({ message: '作业标题不能为空' })
  @IsString({ message: '作业标题必须是字符串' })
  @MaxLength(300, { message: '作业标题最多 300 个字符' })
  title: string;

  @ApiProperty({ description: '所属班级 ID' })
  @IsNotEmpty({ message: '班级 ID 不能为空' })
  @IsUUID('4', { message: '班级 ID 格式不正确' })
  classId: string;

  @ApiPropertyOptional({ description: '关联课程 ID' })
  @IsOptional()
  @IsUUID('4', { message: '课程 ID 格式不正确' })
  courseId?: string;

  @ApiPropertyOptional({ description: '作业描述/要求' })
  @IsOptional()
  @IsString({ message: '作业描述必须是字符串' })
  description?: string;

  @ApiProperty({
    description: '作业类型',
    enum: [1, 2, 3],
    example: 1,
  })
  @IsNotEmpty({ message: '作业类型不能为空' })
  @IsInt({ message: '作业类型必须是整数' })
  @Min(1, { message: '作业类型最小为 1' })
  @Max(3, { message: '作业类型最大为 3' })
  type: number;

  @ApiPropertyOptional({ description: '学科', example: '数学' })
  @IsOptional()
  @IsString({ message: '学科必须是字符串' })
  @MaxLength(100, { message: '学科最多 100 个字符' })
  subject?: string;

  @ApiPropertyOptional({ description: '附件列表（JSON 数组）' })
  @IsOptional()
  @IsArray({ message: '附件必须是数组' })
  attachments?: any[];

  @ApiPropertyOptional({ description: '截止时间', example: '2024-09-15T23:59:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: '日期格式不正确' })
  dueDate?: string;

  @ApiPropertyOptional({ description: '满分分值', default: 100 })
  @IsOptional()
  @IsNumber({}, { message: '满分分值必须是数字' })
  @Min(0, { message: '满分分值不能为负数' })
  maxScore?: number;
}
