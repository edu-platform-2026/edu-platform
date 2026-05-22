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
 * Permissions Guard
 * Checks if user has required permissions.
 * Falls back to default role-based permissions when database mappings are missing.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  /**
   * Default permissions for each role.
   * Used as fallback when JWT token doesn't contain permissions (database mappings missing).
   */
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
      this.logger.warn('PermissionsGuard: no user in request');
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles: string[] = user.roles || [];

    // Admin bypasses all permission checks
    if (userRoles.includes('ADMIN')) {
      return true;
    }

    // Build effective permissions from JWT + default role permissions
    let userPermissions: string[] = [...(user.permissions || [])];

    // If JWT has no permissions, use default role-based permissions
    if (userPermissions.length === 0 && userRoles.length > 0) {
      for (const role of userRoles) {
        const defaultPerms = PermissionsGuard.DEFAULT_ROLE_PERMISSIONS[role] || [];
        if (defaultPerms.includes('*')) {
          return true;
        }
        userPermissions.push(...defaultPerms);
      }
      userPermissions = [...new Set(userPermissions)];
    }

    const missingPermissions = requiredPermissions.filter(
      (permission) => !userPermissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      this.logger.warn(
        `PermissionsGuard: user ${user.id} missing permissions: ${missingPermissions.join(', ')}`,
      );
      throw new ForbiddenException(
        `Missing permissions: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
