import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 数据库种子文件
 * 初始化默认数据：
 * - 默认机构
 * - 默认角色（admin, teacher, parent, student）
 * - 默认权限并关联到角色
 * - 默认管理员用户（admin / admin123）
 */
async function main() {
  console.log('开始初始化数据库种子数据...\n');

  // ==================== 1. 创建默认机构 ====================
  console.log('1. 创建默认机构...');
  const institution = await prisma.institution.upsert({
    where: { id: 'default-institution-id' },
    update: {},
    create: {
      id: 'default-institution-id',
      name: '示范教育机构',
      description: '这是一个示范教育管理机构，用于系统初始化。',
      slogan: '用心教育，成就未来',
      address: '北京市海淀区中关村大街1号',
      phone: '010-12345678',
      email: 'contact@demo-edu.com',
      website: 'https://www.demo-edu.com',
      businessHours: '周一至周五 8:00-18:00',
      status: 1,
    },
  });
  console.log(`   机构创建成功: ${institution.name}\n`);

  // ==================== 2. 创建默认角色 ====================
  console.log('2. 创建默认角色...');
  // System roles are created BEFORE any institution exists,
  // so we use findFirst + conditional create instead of upsert with compound unique.
  let adminRole = await prisma.role.findFirst({
    where: { code: 'ADMIN', institutionId: null },
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { code: 'ADMIN', name: '管理员', description: '系统管理员，拥有所有权限', isSystem: true },
    });
  }

  let teacherRole = await prisma.role.findFirst({
    where: { code: 'TEACHER', institutionId: null },
  });
  if (!teacherRole) {
    teacherRole = await prisma.role.create({
      data: { code: 'TEACHER', name: '教师', description: '教师角色，拥有教学相关权限', isSystem: true },
    });
  }

  let parentRole = await prisma.role.findFirst({
    where: { code: 'PARENT', institutionId: null },
  });
  if (!parentRole) {
    parentRole = await prisma.role.create({
      data: { code: 'PARENT', name: '家长', description: '家长角色，可查看学生信息', isSystem: true },
    });
  }

  let studentRole = await prisma.role.findFirst({
    where: { code: 'STUDENT', institutionId: null },
  });
  if (!studentRole) {
    studentRole = await prisma.role.create({
      data: { code: 'STUDENT', name: '学生', description: '学生角色，可提交作业和查看课程', isSystem: true },
    });
  }

  const roles = [adminRole, teacherRole, parentRole, studentRole];

  console.log(`   角色创建成功: ${roles.map((r) => r.name).join(', ')}\n`);

  // ==================== 3. 创建默认权限 ====================
  console.log('3. 创建默认权限...');
  const permissions = await Promise.all([
    // 机构权限
    prisma.permission.upsert({
      where: { code: 'INSTITUTION_READ' },
      update: {},
      create: {
        name: '查看机构信息',
        code: 'INSTITUTION_READ',
        module: 'institution',
        description: '查看机构基本信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'INSTITUTION_UPDATE' },
      update: {},
      create: {
        name: '更新机构信息',
        code: 'INSTITUTION_UPDATE',
        module: 'institution',
        description: '更新机构基本信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'INSTITUTION_MANAGE' },
      update: {},
      create: {
        name: '管理机构',
        code: 'INSTITUTION_MANAGE',
        module: 'institution',
        description: '管理机构所有设置',
      },
    }),

    // 用户权限
    prisma.permission.upsert({
      where: { code: 'USER_READ' },
      update: {},
      create: {
        name: '查看用户',
        code: 'USER_READ',
        module: 'user',
        description: '查看用户列表和详情',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'USER_CREATE' },
      update: {},
      create: {
        name: '创建用户',
        code: 'USER_CREATE',
        module: 'user',
        description: '创建新用户',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'USER_UPDATE' },
      update: {},
      create: {
        name: '更新用户',
        code: 'USER_UPDATE',
        module: 'user',
        description: '更新用户信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'USER_DELETE' },
      update: {},
      create: {
        name: '删除用户',
        code: 'USER_DELETE',
        module: 'user',
        description: '删除用户',
      },
    }),

    // 班级权限
    prisma.permission.upsert({
      where: { code: 'CLASS_READ' },
      update: {},
      create: {
        name: '查看班级',
        code: 'CLASS_READ',
        module: 'class',
        description: '查看班级列表和详情',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'CLASS_CREATE' },
      update: {},
      create: {
        name: '创建班级',
        code: 'CLASS_CREATE',
        module: 'class',
        description: '创建新班级',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'CLASS_UPDATE' },
      update: {},
      create: {
        name: '更新班级',
        code: 'CLASS_UPDATE',
        module: 'class',
        description: '更新班级信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'CLASS_DELETE' },
      update: {},
      create: {
        name: '删除班级',
        code: 'CLASS_DELETE',
        module: 'class',
        description: '删除班级',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'CLASS_MANAGE_STUDENTS' },
      update: {},
      create: {
        name: '管理班级学生',
        code: 'CLASS_MANAGE_STUDENTS',
        module: 'class',
        description: '添加和移除班级学生',
      },
    }),

    // 课程权限
    prisma.permission.upsert({
      where: { code: 'COURSE_READ' },
      update: {},
      create: {
        name: '查看课程',
        code: 'COURSE_READ',
        module: 'course',
        description: '查看课程列表和详情',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'COURSE_CREATE' },
      update: {},
      create: {
        name: '创建课程',
        code: 'COURSE_CREATE',
        module: 'course',
        description: '创建新课程',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'COURSE_UPDATE' },
      update: {},
      create: {
        name: '更新课程',
        code: 'COURSE_UPDATE',
        module: 'course',
        description: '更新课程信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'COURSE_DELETE' },
      update: {},
      create: {
        name: '删除课程',
        code: 'COURSE_DELETE',
        module: 'course',
        description: '删除课程',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'COURSE_SCHEDULE' },
      update: {},
      create: {
        name: '课程排课',
        code: 'COURSE_SCHEDULE',
        module: 'course',
        description: '管理课程排课',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'COURSE_ATTENDANCE' },
      update: {},
      create: {
        name: '上课记录',
        code: 'COURSE_ATTENDANCE',
        module: 'course',
        description: '管理上课记录',
      },
    }),

    // 作业权限
    prisma.permission.upsert({
      where: { code: 'ASSIGNMENT_READ' },
      update: {},
      create: {
        name: '查看作业',
        code: 'ASSIGNMENT_READ',
        module: 'assignment',
        description: '查看作业列表和详情',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'ASSIGNMENT_CREATE' },
      update: {},
      create: {
        name: '创建作业',
        code: 'ASSIGNMENT_CREATE',
        module: 'assignment',
        description: '创建新作业',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'ASSIGNMENT_UPDATE' },
      update: {},
      create: {
        name: '更新作业',
        code: 'ASSIGNMENT_UPDATE',
        module: 'assignment',
        description: '更新作业信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'ASSIGNMENT_DELETE' },
      update: {},
      create: {
        name: '删除作业',
        code: 'ASSIGNMENT_DELETE',
        module: 'assignment',
        description: '删除作业',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'ASSIGNMENT_SUBMIT' },
      update: {},
      create: {
        name: '提交作业',
        code: 'ASSIGNMENT_SUBMIT',
        module: 'assignment',
        description: '学生提交作业',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'ASSIGNMENT_GRADE' },
      update: {},
      create: {
        name: '批改作业',
        code: 'ASSIGNMENT_GRADE',
        module: 'assignment',
        description: '教师批改作业',
      },
    }),

    // 资源权限
    prisma.permission.upsert({
      where: { code: 'RESOURCE_READ' },
      update: {},
      create: {
        name: '查看资源',
        code: 'RESOURCE_READ',
        module: 'resource',
        description: '查看资源列表和详情',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'RESOURCE_CREATE' },
      update: {},
      create: {
        name: '上传资源',
        code: 'RESOURCE_CREATE',
        module: 'resource',
        description: '上传新资源',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'RESOURCE_UPDATE' },
      update: {},
      create: {
        name: '更新资源',
        code: 'RESOURCE_UPDATE',
        module: 'resource',
        description: '更新资源信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'RESOURCE_DELETE' },
      update: {},
      create: {
        name: '删除资源',
        code: 'RESOURCE_DELETE',
        module: 'resource',
        description: '删除资源',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'RESOURCE_DOWNLOAD' },
      update: {},
      create: {
        name: '下载资源',
        code: 'RESOURCE_DOWNLOAD',
        module: 'resource',
        description: '下载教学资源',
      },
    }),

    // 通知权限
    prisma.permission.upsert({
      where: { code: 'NOTIFICATION_READ' },
      update: {},
      create: {
        name: '查看通知',
        code: 'NOTIFICATION_READ',
        module: 'notification',
        description: '查看通知列表和详情',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'NOTIFICATION_CREATE' },
      update: {},
      create: {
        name: '创建通知',
        code: 'NOTIFICATION_CREATE',
        module: 'notification',
        description: '创建新通知',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'NOTIFICATION_UPDATE' },
      update: {},
      create: {
        name: '更新通知',
        code: 'NOTIFICATION_UPDATE',
        module: 'notification',
        description: '更新通知信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'NOTIFICATION_DELETE' },
      update: {},
      create: {
        name: '删除通知',
        code: 'NOTIFICATION_DELETE',
        module: 'notification',
        description: '删除通知',
      },
    }),

    // 反馈权限
    prisma.permission.upsert({
      where: { code: 'FEEDBACK_READ' },
      update: {},
      create: {
        name: '查看反馈',
        code: 'FEEDBACK_READ',
        module: 'feedback',
        description: '查看反馈列表和详情',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'FEEDBACK_CREATE' },
      update: {},
      create: {
        name: '提交反馈',
        code: 'FEEDBACK_CREATE',
        module: 'feedback',
        description: '提交新反馈',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'FEEDBACK_UPDATE' },
      update: {},
      create: {
        name: '更新反馈',
        code: 'FEEDBACK_UPDATE',
        module: 'feedback',
        description: '更新反馈信息',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'FEEDBACK_DELETE' },
      update: {},
      create: {
        name: '删除反馈',
        code: 'FEEDBACK_DELETE',
        module: 'feedback',
        description: '删除反馈',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'FEEDBACK_REPLY' },
      update: {},
      create: {
        name: '回复反馈',
        code: 'FEEDBACK_REPLY',
        module: 'feedback',
        description: '回复用户反馈',
      },
    }),

    // 统计权限
    prisma.permission.upsert({
      where: { code: 'STATISTICS_READ' },
      update: {},
      create: {
        name: '查看统计',
        code: 'STATISTICS_READ',
        module: 'statistics',
        description: '查看统计数据',
      },
    }),
  ]);

  const permissionMap = new Map(permissions.map((p) => [p.code, p]));
  console.log(`   权限创建成功: ${permissions.length} 个权限\n`);

  // ==================== 4. 关联角色和权限 ====================
  console.log('4. 关联角色和权限...');

  // 管理员：拥有所有权限
  const adminPermissions = permissions.map((p) => ({
    roleId: adminRole!.id,
    permissionId: p.id,
  }));

  // 教师权限
  const teacherPermissionCodes = [
    'INSTITUTION_READ',
    'USER_READ',
    'CLASS_READ',
    'CLASS_MANAGE_STUDENTS',
    'COURSE_READ',
    'COURSE_CREATE',
    'COURSE_UPDATE',
    'COURSE_SCHEDULE',
    'COURSE_ATTENDANCE',
    'ASSIGNMENT_READ',
    'ASSIGNMENT_CREATE',
    'ASSIGNMENT_UPDATE',
    'ASSIGNMENT_GRADE',
    'RESOURCE_READ',
    'RESOURCE_CREATE',
    'RESOURCE_UPDATE',
    'RESOURCE_DELETE',
    'RESOURCE_DOWNLOAD',
    'NOTIFICATION_READ',
    'NOTIFICATION_CREATE',
    'NOTIFICATION_UPDATE',
    'FEEDBACK_READ',
    'FEEDBACK_REPLY',
    'STATISTICS_READ',
  ];

  const teacherPermissions = teacherPermissionCodes
    .filter((code) => permissionMap.has(code))
    .map((code) => ({
      roleId: teacherRole!.id,
      permissionId: permissionMap.get(code)!.id,
    }));

  // 家长权限
  const parentPermissionCodes = [
    'CLASS_READ',
    'COURSE_READ',
    'ASSIGNMENT_READ',
    'RESOURCE_READ',
    'RESOURCE_DOWNLOAD',
    'NOTIFICATION_READ',
    'FEEDBACK_READ',
    'FEEDBACK_CREATE',
  ];

  const parentPermissions = parentPermissionCodes
    .filter((code) => permissionMap.has(code))
    .map((code) => ({
      roleId: parentRole!.id,
      permissionId: permissionMap.get(code)!.id,
    }));

  // 学生权限
  const studentPermissionCodes = [
    'CLASS_READ',
    'COURSE_READ',
    'ASSIGNMENT_READ',
    'ASSIGNMENT_SUBMIT',
    'RESOURCE_READ',
    'RESOURCE_DOWNLOAD',
    'NOTIFICATION_READ',
    'FEEDBACK_READ',
    'FEEDBACK_CREATE',
    'STATISTICS_READ',
  ];

  const studentPermissions = studentPermissionCodes
    .filter((code) => permissionMap.has(code))
    .map((code) => ({
      roleId: studentRole!.id,
      permissionId: permissionMap.get(code)!.id,
    }));

  // 批量创建角色权限关联
  const allRolePermissions = [
    ...adminPermissions,
    ...teacherPermissions,
    ...parentPermissions,
    ...studentPermissions,
  ];

  for (const rp of allRolePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rp.roleId,
          permissionId: rp.permissionId,
        },
      },
      update: {},
      create: rp,
    });
  }

  console.log(`   角色权限关联成功: ${allRolePermissions.length} 条关联记录\n`);

  // ==================== 5. 创建默认管理员用户 ====================
  console.log('5. 创建默认管理员用户...');

  // 使用 bcrypt 加密密码
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);

  const adminUser = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      institutionId: institution.id,
      username: 'admin',
      passwordHash: hashedPassword,
      realName: '系统管理员',
      email: 'admin@demo-edu.com',
      phone: '13800138000',
      gender: 0,
    },
  });

  // 关联管理员角色
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole!.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole!.id,
    },
  });

  console.log(`   管理员用户创建成功:`);
  console.log(`   - 用户名: admin`);
  console.log(`   - 密码: admin123`);
  console.log(`   - 姓名: ${adminUser.realName}`);
  console.log(`   - 邮箱: ${adminUser.email}\n`);

  console.log('数据库种子数据初始化完成！');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('种子数据初始化失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
