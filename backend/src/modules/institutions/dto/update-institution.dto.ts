import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEmail, IsUrl } from 'class-validator';

/**
 * 更新机构信息 DTO
 * 用于更新当前机构的基本信息
 */
export class UpdateInstitutionDto {
  @ApiPropertyOptional({ description: '机构名称', example: '阳光教育中心' })
  @IsOptional()
  @IsString({ message: '机构名称必须是字符串' })
  @MaxLength(200, { message: '机构名称最多 200 个字符' })
  name?: string;

  @ApiPropertyOptional({ description: '机构简介' })
  @IsOptional()
  @IsString({ message: '机构简介必须是字符串' })
  description?: string;

  @ApiPropertyOptional({ description: '机构标语', example: '用心教育，成就未来' })
  @IsOptional()
  @IsString({ message: '机构标语必须是字符串' })
  @MaxLength(500, { message: '机构标语最多 500 个字符' })
  slogan?: string;

  @ApiPropertyOptional({ description: '机构地址', example: '北京市海淀区中关村大街1号' })
  @IsOptional()
  @IsString({ message: '机构地址必须是字符串' })
  @MaxLength(500, { message: '机构地址最多 500 个字符' })
  address?: string;

  @ApiPropertyOptional({ description: '联系电话', example: '010-12345678' })
  @IsOptional()
  @IsString({ message: '联系电话必须是字符串' })
  @MaxLength(50, { message: '联系电话最多 50 个字符' })
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱地址', example: 'contact@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100, { message: '邮箱最多 100 个字符' })
  email?: string;

  @ApiPropertyOptional({ description: '微信号', example: 'edu_wechat' })
  @IsOptional()
  @IsString({ message: '微信号必须是字符串' })
  @MaxLength(100, { message: '微信号最多 100 个字符' })
  wechat?: string;

  @ApiPropertyOptional({ description: '官方网站', example: 'https://www.example.com' })
  @IsOptional()
  @IsUrl({}, { message: '网站地址格式不正确' })
  @MaxLength(300, { message: '网站地址最多 300 个字符' })
  website?: string;

  @ApiPropertyOptional({ description: '营业时间', example: '周一至周五 8:00-18:00' })
  @IsOptional()
  @IsString({ message: '营业时间必须是字符串' })
  @MaxLength(200, { message: '营业时间最多 200 个字符' })
  businessHours?: string;
}
