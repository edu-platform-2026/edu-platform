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

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  private static readonly DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN: ['*'],
    TEACHER: [
      'assignment:create', 'assignment:read', 'assignment:update', 'assignment:delete',
      'assignment:grade', 'assignment:submit', 'assignment:export',
      'course:create', 'course:read', 'course:update', 'course:delete',
      'course:schedule', 'course:attendance', 'course:export',
      'resource:create', 'resource:read', 'resource:update', 'resource:delete',
      'resource:download', 'resource:manage',
      'class:create', 'class:read', 'class:update', 'class:delete',
      'class:manage_students', 'class:export',
      'notification:create', 'notification:read', 'notification:update',
      'notification:delete', 'notification:publish',
      'feedback:create', 'feedback:read', 'feedback:reply', 'feedback:update',
      'feedback:delete', 'feedback:manage',
      'analytics:read', 'analytics:export', 'analytics:progress',
      'analytics:attendance', 'analytics:scores',
      'user:read', 'user:create', 'user:update',
      'institution:read',
      'message:read', 'message:create', 'message:update', 'message:delete',
    ],
    STUDENT: [
      'assignment:read', 'assignment:submit',
      'course:read',
      'resource:read', 'resource:download',
      'class:read',
      'notification:read',
      'feedback:create', 'feedback:read',
      'analytics:read', 'analytics:progress',
      'user:read',
      'message:read', 'message:create', 'message:update', 'message:delete',
    ],
    PARENT: [
      'assignment:read',
      'course:read',
      'resource:read',
      'class:read',
      'notification:read',
      'feedback:create', 'feedback:read',
      'analytics:read', 'analytics:progress',
      'user:read',
      'message:read', 'message:create', 'message:update', 'message:delete',
    ],
  };

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    const userRoles: string[] = user.roles || [];

    // Admin bypasses all permission checks
    if (userRoles.includes('ADMIN')) {
      return true;
    }

    // Always build permissions from role defaults + JWT permissions
    const effectivePermissions = new Set<string>();

    // Add default permissions based on role
    for (const role of userRoles) {
      const defaultPerms = PermissionsGuard.DEFAULT_ROLE_PERMISSIONS[role] || [];
      for (const perm of defaultPerms) {
        effectivePermissions.add(perm);
      }
    }

    // Also add JWT permissions (may supplement defaults)
    if (user.permissions && Array.isArray(user.permissions)) {
      for (const perm of user.permissions) {
        effectivePermissions.add(perm);
      }
    }

    // Check if user has all required permissions
    const missingPermissions = requiredPermissions.filter(
      (permission) => !effectivePermissions.has(permission),
    );

    if (missingPermissions.length > 0) {
      this.logger.warn(
        `User ${user.id} missing permissions: ${missingPermissions.join(', ')}`,
      );
      throw new ForbiddenException(
        `权限不足，缺少: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
