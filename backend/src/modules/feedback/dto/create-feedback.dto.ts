import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateFeedbackDto {
  @ApiPropertyOptional({ description: 'Feedback title', example: 'Suggestion about course schedule' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiProperty({ description: 'Feedback content' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Feedback category',
    enum: ['suggestion', 'complaint', 'praise', 'other'],
    example: 'suggestion',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Related teacher ID' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Attachments (JSON array)' })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}
