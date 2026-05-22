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
      // 作业模块
      Permission.ASSIGNMENT_CREATE,
      Permission.ASSIGNMENT_READ,
      Permission.ASSIGNMENT_UPDATE,
      Permission.ASSIGNMENT_DELETE,
      Permission.ASSIGNMENT_GRADE,
      Permission.ASSIGNMENT_EXPORT,
      // 课程模块
      Permission.COURSE_CREATE,
      Permission.COURSE_READ,
      Permission.COURSE_UPDATE,
      Permission.COURSE_DELETE,
      Permission.COURSE_SCHEDULE,
      Permission.COURSE_ATTENDANCE,
      Permission.COURSE_EXPORT,
      // 教学资源模块
      Permission.RESOURCE_CREATE,
      Permission.RESOURCE_READ,
      Permission.RESOURCE_UPDATE,
      Permission.RESOURCE_DELETE,
      Permission.RESOURCE_DOWNLOAD,
      Permission.RESOURCE_MANAGE,
      // 班级模块
      Permission.CLASS_CREATE,
      Permission.CLASS_READ,
      Permission.CLASS_UPDATE,
      Permission.CLASS_DELETE,
      Permission.CLASS_MANAGE_STUDENTS,
      // 通知模块
      Permission.NOTIFICATION_CREATE,
      Permission.NOTIFICATION_READ,
      Permission.NOTIFICATION_UPDATE,
      Permission.NOTIFICATION_DELETE,
      Permission.NOTIFICATION_PUBLISH,
      // 反馈模块
      Permission.FEEDBACK_READ,
      Permission.FEEDBACK_REPLY,
      Permission.FEEDBACK_MANAGE,
      // 数据分析模块
      Permission.ANALYTICS_READ,
      Permission.ANALYTICS_EXPORT,
      Permission.ANALYTICS_PROGRESS,
      Permission.ANALYTICS_ATTENDANCE,
      Permission.ANALYTICS_SCORES,
      // 用户模块
      Permission.USER_READ,
      // 机构模块
      Permission.INSTITUTION_READ,
      // 消息模块
      Permission.MESSAGE_CREATE,
      Permission.MESSAGE_READ,
      Permission.MESSAGE_DELETE,
      Permission.MESSAGE_MANAGE,
      // 邀请模块
      Permission.INVITATION_CREATE,
      Permission.INVITATION_READ,
      // 操作日志模块
      Permission.OPERATION_LOG_READ,
      // 支付模块
      Permission.PAYMENT_CREATE,
      Permission.PAYMENT_READ,
      Permission.PAYMENT_UPDATE,
      Permission.PAYMENT_DELETE,
      Permission.PAYMENT_PAY,
    ],
    STUDENT: [
      // 作业模块
      Permission.ASSIGNMENT_READ,
      Permission.ASSIGNMENT_SUBMIT,
      // 课程模块
      Permission.COURSE_READ,
      Permission.COURSE_ATTENDANCE,
      // 教学资源模块
      Permission.RESOURCE_READ,
      Permission.RESOURCE_DOWNLOAD,
      // 班级模块
      Permission.CLASS_READ,
      // 通知模块
      Permission.NOTIFICATION_READ,
      // 反馈模块
      Permission.FEEDBACK_CREATE,
      Permission.FEEDBACK_READ,
      // 数据分析模块
      Permission.ANALYTICS_READ,
      Permission.ANALYTICS_PROGRESS,
      // 用户模块
      Permission.USER_READ,
      // 消息模块
      Permission.MESSAGE_CREATE,
      Permission.MESSAGE_READ,
    ],
    PARENT: [
      // 作业模块
      Permission.ASSIGNMENT_READ,
      // 课程模块
      Permission.COURSE_READ,
      // 班级模块
      Permission.CLASS_READ,
      // 通知模块
      Permission.NOTIFICATION_READ,
      // 反馈模块
      Permission.FEEDBACK_CREATE,
      Permission.FEEDBACK_READ,
      // 数据分析模块
      Permission.ANALYTICS_READ,
      Permission.ANALYTICS_SCORES,
      Permission.ANALYTICS_ATTENDANCE,
      // 用户模块
      Permission.USER_READ,
      // 机构模块
      Permission.INSTITUTION_READ,
      // 消息模块
      Permission.MESSAGE_CREATE,
      Permission.MESSAGE_READ,
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
