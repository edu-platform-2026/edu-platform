/**
 * 用户角色枚举
 * 定义系统中所有可用的用户角色类型
 */
export enum Role {
  /** 管理员 - 拥有系统所有权限 */
  ADMIN = 'ADMIN',

  /** 教师 - 管理课程、作业、成绩等 */
  TEACHER = 'TEACHER',

  /** 家长 - 查看学生信息、提交反馈 */
  PARENT = 'PARENT',

  /** 学生 - 查看课程、提交作业 */
  STUDENT = 'STUDENT',
}
