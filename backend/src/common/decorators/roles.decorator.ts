import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/** 角色元数据键 */
export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 * 用于标记路由所需的角色要求
 *
 * @example
 * ```typescript
 * @Roles(Role.ADMIN, Role.TEACHER)
 * @Get('protected')
 * getProtectedResource() { ... }
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
