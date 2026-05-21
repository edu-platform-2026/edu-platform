import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  MaxLength,
} from 'class-validator';

/**
 * 创建/上传教学资源 DTO
 */
export class CreateResourceDto {
  @ApiProperty({ description: '资源标题', example: '第一章课件' })
  @IsNotEmpty({ message: '资源标题不能为空' })
  @IsString({ message: '资源标题必须是字符串' })
  @MaxLength(300, { message: '资源标题最多 300 个字符' })
  title: string;

  @ApiPropertyOptional({ description: '资源描述' })
  @IsOptional()
  @IsString({ message: '资源描述必须是字符串' })
  description?: string;

  @ApiPropertyOptional({ description: '资源分类', example: '课件' })
  @IsOptional()
  @IsString({ message: '资源分类必须是字符串' })
  @MaxLength(100, { message: '资源分类最多 100 个字符' })
  category?: string;

  @ApiPropertyOptional({ description: '关联学科', example: '数学' })
  @IsOptional()
  @IsString({ message: '学科必须是字符串' })
  @MaxLength(100, { message: '学科最多 100 个字符' })
  subject?: string;

  @ApiProperty({ description: '文件 URL' })
  @IsNotEmpty({ message: '文件 URL 不能为空' })
  @IsString({ message: '文件 URL 必须是字符串' })
  @MaxLength(500, { message: '文件 URL 最多 500 个字符' })
  fileUrl: string;

  @ApiPropertyOptional({ description: '文件大小（字节）' })
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({ description: '文件类型', example: 'application/pdf' })
  @IsOptional()
  @IsString({ message: '文件类型必须是字符串' })
  @MaxLength(50, { message: '文件类型最多 50 个字符' })
  fileType?: string;

  @ApiPropertyOptional({ description: '缩略图 URL' })
  @IsOptional()
  @IsString({ message: '缩略图 URL 必须是字符串' })
  @MaxLength(500, { message: '缩略图 URL 最多 500 个字符' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: '是否公开', default: false })
  @IsOptional()
  @IsBoolean({ message: '是否公开必须是布尔值' })
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '标签列表' })
  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  tags?: string[];
}
