import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../enums/permission.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * 权限守卫
 * 根据 @RequirePermissions() 装饰器要求验证用户是否具有所需权限
 * 管理员角色默认拥有所有权限
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由所需的权限列表
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置权限要求，直接放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 获取当前请求中的用户信息
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('权限守卫：请求中未找到用户信息');
      throw new ForbiddenException('用户未认证');
    }

    // 管理员角色默认拥有所有权限
    const userRoles: string[] = user.roles || [];
    if (userRoles.includes('ADMIN')) {
      return true;
    }

    // 检查用户是否拥有所需的所有权限
    const userPermissions: string[] = user.permissions || [];
    const missingPermissions = requiredPermissions.filter(
      (permission) => !userPermissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      this.logger.warn(
        `权限守卫：用户 ${user.id} 缺少权限: ${missingPermissions.join(', ')}`,
      );
      throw new ForbiddenException(
        `权限不足，缺少以下权限: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
