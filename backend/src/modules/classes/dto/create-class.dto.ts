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
} from 'class-validator';

/**
 * 创建班级 DTO
 */
export class CreateClassDto {
  @ApiProperty({ description: '班级名称', example: '一年级一班' })
  @IsNotEmpty({ message: '班级名称不能为空' })
  @IsString({ message: '班级名称必须是字符串' })
  @MaxLength(100, { message: '班级名称最多 100 个字符' })
  name: string;

  @ApiPropertyOptional({ description: '年级', example: '一年级' })
  @IsOptional()
  @IsString({ message: '年级必须是字符串' })
  @MaxLength(50, { message: '年级最多 50 个字符' })
  grade?: string;

  @ApiPropertyOptional({ description: '班级描述' })
  @IsOptional()
  @IsString({ message: '班级描述必须是字符串' })
  @MaxLength(500, { message: '班级描述最多 500 个字符' })
  description?: string;

  @ApiPropertyOptional({ description: '班主任教师 ID' })
  @IsOptional()
  @IsUUID('4', { message: '班主任 ID 格式不正确' })
  homeroomTeacherId?: string;

  @ApiPropertyOptional({ description: '最大学生人数', default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt({ message: '最大学生人数必须是整数' })
  @Min(1, { message: '最大学生人数最少为 1' })
  @Max(200, { message: '最大学生人数最多为 200' })
  maxStudents?: number;
}
