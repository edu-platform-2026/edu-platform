import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户参数装饰器
 * 从请求对象中提取当前已认证的用户信息
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 * @Get('profile')
 * getUserId(@CurrentUser('id') userId: string) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 如果指定了属性名，返回对应属性；否则返回整个用户对象
    return data ? user?.[data] : user;
  },
);
