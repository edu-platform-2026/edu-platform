import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 错误响应格式接口
 */
interface ErrorResponse {
  code: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
}

/**
 * 全局 HTTP 异常过滤器
 * 统一处理所有 HTTP 异常，返回标准化的错误响应格式
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // 获取异常响应内容
    const exceptionResponse = exception.getResponse();
    let message = '服务器内部错误';
    let error = 'Internal Server Error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const response = exceptionResponse as any;
      message = response.message || message;
      error = response.error || error;

      // 如果 message 是数组（class-validator 验证错误），取第一条
      if (Array.isArray(message)) {
        message = message[0];
      }
    }

    // 构建错误响应
    const errorResponse: ErrorResponse = {
      code: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 记录错误日志（5xx 错误记录详细信息）
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status}: ${message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status}: ${message}`,
      );
    }

    // 发送错误响应
    response.status(status).json(errorResponse);
  }
}
