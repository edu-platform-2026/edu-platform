import { UserRole } from '../types/user';

/**
 * 获取角色对应的首页路径
 * 支持 UserRole 枚举和字符串形式的角色值
 */
export const getRoleHomePath = (role: UserRole | string | undefined | null): string => {
  if (!role) return '/login';
  const roleStr = String(role).toUpperCase();
  const paths: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    TEACHER: '/teacher/dashboard',
    PARENT: '/parent/dashboard',
    STUDENT: '/student/dashboard',
  };
  return paths[roleStr] || '/login';
};

/**
 * 判断用户是否为指定角色
 */
export const hasRole = (userRole: UserRole | string | undefined | null, targetRole: UserRole | string): boolean => {
  if (!userRole) return false;
  return String(userRole).toUpperCase() === String(targetRole).toUpperCase();
};

/**
 * 判断用户是否为管理员
 */
export const isAdmin = (role: UserRole | string | undefined | null): boolean => {
  return hasRole(role, UserRole.ADMIN);
};

/**
 * 判断用户是否为教师
 */
export const isTeacher = (role: UserRole | string | undefined | null): boolean => {
  return hasRole(role, UserRole.TEACHER);
};

/**
 * 判断用户是否为家长
 */
export const isParent = (role: UserRole | string | undefined | null): boolean => {
  return hasRole(role, UserRole.PARENT);
};

/**
 * 判断用户是否为学生
 */
export const isStudent = (role: UserRole | string | undefined | null): boolean => {
  return hasRole(role, UserRole.STUDENT);
};

/**
 * 获取角色标签（中文名称）
 */
export const getRoleLabel = (role: UserRole | string | undefined | null): string => {
  if (!role) return '未知';
  const roleStr = String(role).toUpperCase();
  const labels: Record<string, string> = {
    ADMIN: '管理员',
    TEACHER: '教师',
    PARENT: '家长',
    STUDENT: '学生',
  };
  return labels[roleStr] || '未知';
};

/**
 * 检查用户是否有指定权限
 */
export const hasPermission = (role: UserRole | string | undefined | null, permission: string): boolean => {
  if (!role) return false;
  // 管理员拥有所有权限
  if (String(role).toUpperCase() === 'ADMIN') return true;
  return false;
};

/**
 * 检查用户是否有任意一个权限
 */
export const hasAnyPermission = (role: UserRole | string | undefined | null, permissions: string[]): boolean => {
  return permissions.some(p => hasPermission(role, p));
};

/**
 * 检查用户是否有所有权限
 */
export const hasAllPermissions = (role: UserRole | string | undefined | null, permissions: string[]): boolean => {
  return permissions.every(p => hasPermission(role, p));
};
