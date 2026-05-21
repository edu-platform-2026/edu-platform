import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * 角色守卫
 * 根据 @Roles() 装饰器要求验证用户是否具有所需角色
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由所需的角色列表
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置角色要求，直接放行
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 获取当前请求中的用户信息
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('角色守卫：请求中未找到用户信息');
      throw new ForbiddenException('用户未认证');
    }

    // 检查用户是否拥有所需角色之一
    const userRoles: string[] = user.roles || [];
    const hasRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRole) {
      this.logger.warn(
        `角色守卫：用户 ${user.id} 缺少所需角色。需要: ${requiredRoles.join(', ')}，拥有: ${userRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `权限不足，需要以下角色之一: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
