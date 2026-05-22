import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
} from 'class-validator';

/**
 * 鍒涘缓鍙嶉 DTO
 *
 * 鍙嶉鍒嗙被锛? * - 寤鸿
 * - 鎶曡瘔
 * - 琛ㄦ壃
 * - 鍏朵粬
 *
 * 鍙嶉鐘舵€侊細
 * - 1: 寰呭鐞? * - 2: 澶勭悊涓? * - 3: 宸插洖澶? * - 4: 宸插叧闂? */
export class CreateFeedbackDto {
  @ApiPropertyOptional({ description: '鍙嶉鏍囬', example: '鍏充簬璇剧▼瀹夋帓鐨勫缓璁? })
  @IsOptional()
  @IsString({ message: '鍙嶉鏍囬蹇呴』鏄瓧绗︿覆' })
  @MaxLength(300, { message: '鍙嶉鏍囬鏈€澶?300 涓瓧绗? })
  title?: string;

  @ApiProperty({ description: '鍙嶉鍐呭' })
  @IsNotEmpty({ message: '鍙嶉鍐呭涓嶈兘涓虹┖' })
  @IsString({ message: '鍙嶉鍐呭蹇呴』鏄瓧绗︿覆' })
  content: string;

  @ApiPropertyOptional({
    description: '鍙嶉鍒嗙被',
    enum: ['寤鸿', '鎶曡瘔', '琛ㄦ壃', '鍏朵粬'],
    example: '寤鸿',
  })
  @IsOptional()
  @IsString({ message: '鍙嶉鍒嗙被蹇呴』鏄瓧绗︿覆' })
  category?: string;

  @ApiPropertyOptional({ description: '鍏宠仈鏁欏笀 ID' })
  @IsOptional()
  @IsString({ message: '鏁欏笀 ID 蹇呴』鏄瓧绗︿覆' })
  teacherId?: string;

  @ApiPropertyOptional({ description: '闄勪欢鍒楄〃锛圝SON 鏁扮粍锛? })
  @IsOptional()
  @IsArray({ message: '闄勪欢蹇呴』鏄暟缁? })
  attachments?: any[];
}