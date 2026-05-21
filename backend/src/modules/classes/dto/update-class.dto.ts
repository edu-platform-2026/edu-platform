import { PartialType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsIn } from 'class-validator';

/**
 * 更新班级 DTO
 * 继承创建班级 DTO 的所有字段（均为可选）
 */
export class UpdateClassDto extends PartialType(CreateClassDto) {
  @ApiPropertyOptional({ description: '班级状态', enum: [0, 1], example: 1 })
  @IsOptional()
  @IsInt({ message: '状态值必须是整数' })
  @IsIn([0, 1], { message: '状态值必须是 0（停用）或 1（启用）' })
  status?: number;
}
