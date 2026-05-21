import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';

/**
 * 创建课程 DTO
 */
export class CreateCourseDto {
  @ApiProperty({ description: '课程名称', example: '小学数学基础' })
  @IsNotEmpty({ message: '课程名称不能为空' })
  @IsString({ message: '课程名称必须是字符串' })
  @MaxLength(200, { message: '课程名称最多 200 个字符' })
  name: string;

  @ApiProperty({ description: '所属班级 ID' })
  @IsNotEmpty({ message: '班级 ID 不能为空' })
  @IsUUID('4', { message: '班级 ID 格式不正确' })
  classId: string;

  @ApiProperty({ description: '授课教师 ID' })
  @IsNotEmpty({ message: '教师 ID 不能为空' })
  @IsUUID('4', { message: '教师 ID 格式不正确' })
  teacherId: string;

  @ApiPropertyOptional({ description: '学科', example: '数学' })
  @IsOptional()
  @IsString({ message: '学科必须是字符串' })
  @MaxLength(100, { message: '学科最多 100 个字符' })
  subject?: string;

  @ApiPropertyOptional({ description: '课程描述' })
  @IsOptional()
  @IsString({ message: '课程描述必须是字符串' })
  description?: string;

  @ApiPropertyOptional({ description: '总课时数', default: 0 })
  @IsOptional()
  @IsInt({ message: '总课时必须是整数' })
  @Min(0, { message: '总课时不能为负数' })
  totalHours?: number;
}
