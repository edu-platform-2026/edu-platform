import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 统一响应格式接口
 */
export interface ApiResponse<T> {
  /** 业务状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 响应时间戳 */
  timestamp: string;
}

/**
 * 响应格式化拦截器
 * 将所有成功的响应统一包装为 { code, message, data, timestamp } 格式
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果响应已经是统一格式，直接返回
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'message' in data &&
          'data' in data
        ) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
          };
        }

        // 将响应数据包装为统一格式
        return {
          code: 200,
          message: 'success',
          data: data ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
