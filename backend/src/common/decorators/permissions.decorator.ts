import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums/permission.enum';

/** 权限元数据键 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * 权限装饰器
 * 用于标记路由所需的细粒度权限要求
 * 通常与 PermissionsGuard 配合使用
 *
 * @example
 * ```typescript
 * @RequirePermissions(Permission.ASSIGNMENT_CREATE, Permission.ASSIGNMENT_UPDATE)
 * @Post('assignments')
 * createAssignment() { ... }
 * ```
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
