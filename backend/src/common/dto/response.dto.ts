import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一响应 DTO
 * 定义标准的 API 响应格式
 */
export class ResponseDto<T = any> {
  @ApiProperty({
    description: '业务状态码',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: '响应消息',
    example: 'success',
  })
  message: string;

  @ApiProperty({
    description: '响应数据',
  })
  data: T;

  @ApiProperty({
    description: '响应时间戳',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  constructor(data: T, message = 'success', code = 200) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * 成功响应快捷方法
 */
export function success<T>(data: T, message = 'success'): ResponseDto<T> {
  return new ResponseDto(data, message, 200);
}

/**
 * 创建成功响应
 */
export function created<T>(data: T, message = '创建成功'): ResponseDto<T> {
  return new ResponseDto(data, message, 201);
}

/**
 * 无内容响应
 */
export function noContent(message = '操作成功'): ResponseDto<null> {
  return new ResponseDto(null, message, 204);
}
