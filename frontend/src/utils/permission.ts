import { UserRole } from '../types/user';

const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'dashboard:view',
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'classes:view', 'classes:create', 'classes:edit', 'classes:delete',
    'courses:view', 'courses:create', 'courses:edit', 'courses:delete',
    'assignments:view', 'assignments:create', 'assignments:edit', 'assignments:delete',
    'resources:view', 'resources:create', 'resources:edit', 'resources:delete',
    'notifications:view', 'notifications:create', 'notifications:edit', 'notifications:delete',
    'feedback:view', 'feedback:reply', 'feedback:delete',
    'analytics:view',
    'settings:view', 'settings:edit',
  ],
  [UserRole.TEACHER]: [
    'dashboard:view',
    'courses:view', 'courses:edit',
    'assignments:view', 'assignments:create', 'assignments:edit', 'assignments:grade',
    'resources:view', 'resources:create', 'resources:edit',
    'classes:view', 'classes:interact',
    'analytics:view',
    'notifications:view',
  ],
  [UserRole.PARENT]: [
    'dashboard:view',
    'assignments:view',
    'progress:view',
    'feedback:create', 'feedback:view',
    'notifications:view',
  ],
  [UserRole.STUDENT]: [
    'dashboard:view',
    'assignments:view', 'assignments:submit',
    'courses:view',
    'resources:view',
    'notifications:view',
  ],
};

export const hasPermission = (role: UserRole, permission: string): boolean => {
  const permissions = rolePermissions[role];
  return permissions ? permissions.includes(permission) : false;
};

export const hasAnyPermission = (role: UserRole, permissions: string[]): boolean => {
  return permissions.some((permission) => hasPermission(role, permission));
};

export const hasAllPermissions = (role: UserRole, permissions: string[]): boolean => {
  return permissions.every((permission) => hasPermission(role, permission));
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    [UserRole.ADMIN]: '管理员',
    [UserRole.TEACHER]: '教师',
    [UserRole.PARENT]: '家长',
    [UserRole.STUDENT]: '学生',
  };
  return labels[role] || role;
};

export const getRoleHomePath = (role: UserRole): string => {
  const paths: Record<UserRole, string> = {
    [UserRole.ADMIN]: '/admin/dashboard',
    [UserRole.TEACHER]: '/teacher/dashboard',
    [UserRole.PARENT]: '/parent/dashboard',
    [UserRole.STUDENT]: '/parent/dashboard',
  };
  return paths[role] || '/';
};
