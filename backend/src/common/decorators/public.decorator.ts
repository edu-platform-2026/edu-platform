import { SetMetadata } from '@nestjs/common';

/** 公开路由元数据键 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 公开路由装饰器
 * 标记路由为公开访问，跳过 JWT 认证守卫
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * login(@Body() loginDto: LoginDto) { ... }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
