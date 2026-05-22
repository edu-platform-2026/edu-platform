import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';

/**
 * 发送消息 DTO
 */
export class CreateMessageDto {
  @ApiProperty({ description: '接收者 ID' })
  @IsNotEmpty({ message: '接收者 ID 不能为空' })
  @IsString({ message: '接收者 ID 必须是字符串' })
  receiverId: string;

  @ApiProperty({ description: '消息内容' })
  @IsNotEmpty({ message: '消息内容不能为空' })
  @IsString({ message: '消息内容必须是字符串' })
  content: string;

  @ApiPropertyOptional({
    description: '消息类型',
    enum: [1, 2, 3],
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: '消息类型必须是整数' })
  @Min(1, { message: '消息类型最小为 1' })
  type?: number;
}
