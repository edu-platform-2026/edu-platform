/**
 * 权限枚举
 * 按模块分组定义系统中所有细粒度权限
 * 权限编码格式: {模块}:{操作}
 */
export enum Permission {
  // ==================== 作业模块权限 ====================
  /** 创建作业 */
  ASSIGNMENT_CREATE = 'assignment:create',
  /** 查看作业 */
  ASSIGNMENT_READ = 'assignment:read',
  /** 更新作业 */
  ASSIGNMENT_UPDATE = 'assignment:update',
  /** 删除作业 */
  ASSIGNMENT_DELETE = 'assignment:delete',
  /** 批改作业 */
  ASSIGNMENT_GRADE = 'assignment:grade',
  /** 提交作业 */
  ASSIGNMENT_SUBMIT = 'assignment:submit',
  /** 导出作业数据 */
  ASSIGNMENT_EXPORT = 'assignment:export',

  // ==================== 课程模块权限 ====================
  /** 创建课程 */
  COURSE_CREATE = 'course:create',
  /** 查看课程 */
  COURSE_READ = 'course:read',
  /** 更新课程 */
  COURSE_UPDATE = 'course:update',
  /** 删除课程 */
  COURSE_DELETE = 'course:delete',
  /** 排课管理 */
  COURSE_SCHEDULE = 'course:schedule',
  /** 记录考勤 */
  COURSE_ATTENDANCE = 'course:attendance',
  /** 导出课程数据 */
  COURSE_EXPORT = 'course:export',

  // ==================== 教学资源模块权限 ====================
  /** 上传资源 */
  RESOURCE_CREATE = 'resource:create',
  /** 查看资源 */
  RESOURCE_READ = 'resource:read',
  /** 更新资源 */
  RESOURCE_UPDATE = 'resource:update',
  /** 删除资源 */
  RESOURCE_DELETE = 'resource:delete',
  /** 下载资源 */
  RESOURCE_DOWNLOAD = 'resource:download',
  /** 管理资源分类 */
  RESOURCE_MANAGE = 'resource:manage',

  // ==================== 班级模块权限 ====================
  /** 创建班级 */
  CLASS_CREATE = 'class:create',
  /** 查看班级 */
  CLASS_READ = 'class:read',
  /** 更新班级 */
  CLASS_UPDATE = 'class:update',
  /** 删除班级 */
  CLASS_DELETE = 'class:delete',
  /** 管理班级学生 */
  CLASS_MANAGE_STUDENTS = 'class:manage_students',
  /** 导出班级数据 */
  CLASS_EXPORT = 'class:export',

  // ==================== 通知模块权限 ====================
  /** 创建通知 */
  NOTIFICATION_CREATE = 'notification:create',
  /** 查看通知 */
  NOTIFICATION_READ = 'notification:read',
  /** 更新通知 */
  NOTIFICATION_UPDATE = 'notification:update',
  /** 删除通知 */
  NOTIFICATION_DELETE = 'notification:delete',
  /** 发布通知 */
  NOTIFICATION_PUBLISH = 'notification:publish',

  // ==================== 反馈模块权限 ====================
  /** 创建反馈 */
  FEEDBACK_CREATE = 'feedback:create',
  /** 查看反馈 */
  FEEDBACK_READ = 'feedback:read',
  /** 回复反馈 */
  FEEDBACK_REPLY = 'feedback:reply',
  /** 更新反馈 */
  FEEDBACK_UPDATE = 'feedback:update',
  /** 删除反馈 */
  FEEDBACK_DELETE = 'feedback:delete',
  /** 管理反馈 */
  FEEDBACK_MANAGE = 'feedback:manage',

  // ==================== 数据分析模块权限 ====================
  /** 查看分析数据 */
  ANALYTICS_READ = 'analytics:read',
  /** 导出分析报告 */
  ANALYTICS_EXPORT = 'analytics:export',
  /** 查看学习进度 */
  ANALYTICS_PROGRESS = 'analytics:progress',
  /** 查看考勤统计 */
  ANALYTICS_ATTENDANCE = 'analytics:attendance',
  /** 查看成绩统计 */
  ANALYTICS_SCORES = 'analytics:scores',

  // ==================== 用户模块权限 ====================
  /** 创建用户 */
  USER_CREATE = 'user:create',
  /** 查看用户 */
  USER_READ = 'user:read',
  /** 更新用户 */
  USER_UPDATE = 'user:update',
  /** 删除用户 */
  USER_DELETE = 'user:delete',
  /** 分配角色 */
  USER_ASSIGN_ROLE = 'user:assign_role',
  /** 管理用户状态 */
  USER_MANAGE_STATUS = 'user:manage_status',
  /** 重置密码 */
  USER_RESET_PASSWORD = 'user:reset_password',
  /** 导出用户数据 */
  USER_EXPORT = 'user:export',

  // ==================== 机构模块权限 ====================
  /** 创建机构 */
  INSTITUTION_CREATE = 'institution:create',
  /** 查看机构 */
  INSTITUTION_READ = 'institution:read',
  /** 更新机构 */
  INSTITUTION_UPDATE = 'institution:update',
  /** 删除机构 */
  INSTITUTION_DELETE = 'institution:delete',
  /** 管理机构设置 */
  INSTITUTION_MANAGE = 'institution:manage',

  // ==================== 消息模块权限 ====================
  /** 发送消息 */
  MESSAGE_CREATE = 'message:create',
  /** 查看消息 */
  MESSAGE_READ = 'message:read',
  /** 删除消息 */
  MESSAGE_DELETE = 'message:delete',
  /** 管理消息 */
  MESSAGE_MANAGE = 'message:manage',

  // ==================== 邀请模块权限 ====================
  /** 创建邀请 */
  INVITATION_CREATE = 'invitation:create',
  /** 查看邀请 */
  INVITATION_READ = 'invitation:read',
  /** 删除邀请 */
  INVITATION_DELETE = 'invitation:delete',
}

/**
 * 权限分组映射
 * 用于按模块展示权限列表
 */
export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  assignment: [
    Permission.ASSIGNMENT_CREATE,
    Permission.ASSIGNMENT_READ,
    Permission.ASSIGNMENT_UPDATE,
    Permission.ASSIGNMENT_DELETE,
    Permission.ASSIGNMENT_GRADE,
    Permission.ASSIGNMENT_SUBMIT,
    Permission.ASSIGNMENT_EXPORT,
  ],
  course: [
    Permission.COURSE_CREATE,
    Permission.COURSE_READ,
    Permission.COURSE_UPDATE,
    Permission.COURSE_DELETE,
    Permission.COURSE_SCHEDULE,
    Permission.COURSE_ATTENDANCE,
    Permission.COURSE_EXPORT,
  ],
  resource: [
    Permission.RESOURCE_CREATE,
    Permission.RESOURCE_READ,
    Permission.RESOURCE_UPDATE,
    Permission.RESOURCE_DELETE,
    Permission.RESOURCE_DOWNLOAD,
    Permission.RESOURCE_MANAGE,
  ],
  class: [
    Permission.CLASS_CREATE,
    Permission.CLASS_READ,
    Permission.CLASS_UPDATE,
    Permission.CLASS_DELETE,
    Permission.CLASS_MANAGE_STUDENTS,
    Permission.CLASS_EXPORT,
  ],
  notification: [
    Permission.NOTIFICATION_CREATE,
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_UPDATE,
    Permission.NOTIFICATION_DELETE,
    Permission.NOTIFICATION_PUBLISH,
  ],
  feedback: [
    Permission.FEEDBACK_CREATE,
    Permission.FEEDBACK_READ,
    Permission.FEEDBACK_REPLY,
    Permission.FEEDBACK_UPDATE,
    Permission.FEEDBACK_DELETE,
    Permission.FEEDBACK_MANAGE,
  ],
  analytics: [
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_PROGRESS,
    Permission.ANALYTICS_ATTENDANCE,
    Permission.ANALYTICS_SCORES,
  ],
  user: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_ASSIGN_ROLE,
    Permission.USER_MANAGE_STATUS,
    Permission.USER_RESET_PASSWORD,
    Permission.USER_EXPORT,
  ],
  institution: [
    Permission.INSTITUTION_CREATE,
    Permission.INSTITUTION_READ,
    Permission.INSTITUTION_UPDATE,
    Permission.INSTITUTION_DELETE,
    Permission.INSTITUTION_MANAGE,
  ],
  message: [
    Permission.MESSAGE_CREATE,
    Permission.MESSAGE_READ,
    Permission.MESSAGE_DELETE,
    Permission.MESSAGE_MANAGE,
  ],
  invitation: [
    Permission.INVITATION_CREATE,
    Permission.INVITATION_READ,
    Permission.INVITATION_DELETE,
  ],
};
