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
 * 其他角色根据 DEFAULT_ROLE_PERMISSIONS 自动获得默认权限
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  // 各角色默认权限映射
  private static readonly DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    TEACHER: [
      'course:create', 'course:read', 'course:update', 'course:delete',
      'homework:create', 'homework:read', 'homework:update', 'homework:delete',
      'exam:create', 'exam:read', 'exam:update', 'exam:delete',
      'student:read', 'attendance:manage', 'grade:manage',
      'resource:create', 'resource:read', 'resource:update', 'resource:delete',
      'message:send', 'message:read', 'message:manage',
      'notification:read', 'notification:create',
      'feedback:read', 'feedback:reply',
      'ai:use', 'invitation:create', 'invitation:read',
    ],
    STUDENT: [
      'course:read', 'homework:read', 'homework:submit',
      'exam:read', 'exam:take', 'exam:review',
      'resource:read', 'mistake:read',
      'message:send', 'message:read',
      'notification:read', 'feedback:create',
      'ai:use',
    ],
    PARENT: [
      'student:read', 'course:read', 'homework:read',
      'exam:read', 'grade:read', 'attendance:read',
      'message:send', 'message:read',
      'notification:read', 'feedback:create',
    ],
  };

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

    // 始终合并角色默认权限 + JWT中的权限
    const effectivePermissions = new Set<string>();

    // 添加角色默认权限
    for (const role of userRoles) {
      const defaultPerms = PermissionsGuard.DEFAULT_ROLE_PERMISSIONS[role] || [];
      for (const perm of defaultPerms) {
        effectivePermissions.add(perm);
      }
    }

    // 添加JWT中的权限（数据库中配置的权限）
    if (user.permissions && Array.isArray(user.permissions)) {
      for (const perm of user.permissions) {
        effectivePermissions.add(perm);
      }
    }

    this.logger.debug(
      `权限守卫：用户 ${user.id} 角色=${userRoles.join(',')} 有效权限数=${effectivePermissions.size}`,
    );

    // 检查用户是否拥有所需的所有权限
    const missingPermissions = requiredPermissions.filter(
      (permission) => !effectivePermissions.has(permission),
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
