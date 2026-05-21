import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 数据分析服务
 * 提供各维度的统计数据聚合功能
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取总览数据（管理者视图）
   * @param institutionId 机构 ID
   * @returns 总览统计数据
   */
  async getOverview(institutionId: string) {
    const [
      totalUsers,
      activeUsers,
      totalClasses,
      totalCourses,
      totalAssignments,
      totalResources,
      totalFeedbacks,
      pendingFeedbacks,
    ] = await Promise.all([
      // 用户统计
      this.prisma.user.count({
        where: { institutionId, status: 1 },
      }),
      // 活跃用户（最近 30 天登录）
      this.prisma.user.count({
        where: {
          institutionId,
          status: 1,
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // 班级数
      this.prisma.class.count({
        where: { institutionId, status: 1 },
      }),
      // 课程数
      this.prisma.course.count({
        where: { institutionId, status: 1 },
      }),
      // 作业数
      this.prisma.assignment.count({
        where: { institutionId, status: { in: [1, 2] } },
      }),
      // 资源数
      this.prisma.resource.count({
        where: { institutionId },
      }),
      // 反馈数
      this.prisma.feedback.count({
        where: { institutionId },
      }),
      // 待处理反馈数
      this.prisma.feedback.count({
        where: { institutionId, status: 1 },
      }),
    ]);

    // 用户角色分布 - 使用 groupBy 统计每个角色的用户数
    const roleDistribution = await this.prisma.userRole.groupBy({
      by: ['roleId'],
      where: {
        user: { institutionId, status: 1 },
      },
      _count: true,
    });

    // 获取角色名称
    const roles = await this.prisma.role.findMany({
      select: { id: true, name: true, code: true },
    });

    const roleMap = new Map(roles.map((r) => [r.id, r]));

    const roleStats = roleDistribution.map((rd) => ({
      roleId: rd.roleId,
      roleName: roleMap.get(rd.roleId)?.name || '未知',
      roleCode: roleMap.get(rd.roleId)?.code || 'unknown',
      count: rd._count || 0,
    }));

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        roleDistribution: roleStats,
      },
      classes: { total: totalClasses },
      courses: { total: totalCourses },
      assignments: { total: totalAssignments },
      resources: { total: totalResources },
      feedbacks: {
        total: totalFeedbacks,
        pending: pendingFeedbacks,
        resolved: totalFeedbacks - pendingFeedbacks,
      },
    };
  }

  /**
   * 获取教学数据统计（教师视图）
   * @param teacherId 教师 ID
   * @returns 教学统计数据
   */
  async getTeachingData(teacherId: string) {
    const [
      totalCourses,
      totalSchedules,
      totalAttendances,
      completedAttendances,
      cancelledAttendances,
    ] = await Promise.all([
      // 教师的课程数
      this.prisma.course.count({
        where: { teacherId, status: 1 },
      }),
      // 教师的排课数
      this.prisma.schedule.count({
        where: {
          course: { teacherId, status: 1 },
        },
      }),
      // 教师的上课记录总数
      this.prisma.attendance.count({
        where: { teacherId },
      }),
      // 已完成的上课记录
      this.prisma.attendance.count({
        where: { teacherId, status: { in: [1, 3] } },
      }),
      // 已取消的上课记录
      this.prisma.attendance.count({
        where: { teacherId, status: 2 },
      }),
    ]);

    // 获取教师的课程列表
    const courses = await this.prisma.course.findMany({
      where: { teacherId, status: 1 },
      select: {
        id: true,
        name: true,
        subject: true,
        totalHours: true,
        completedHours: true,
        class: {
          select: { id: true, name: true },
        },
      },
    });

    // 获取教师的作业统计
    const assignmentStats = await this.prisma.assignment.groupBy({
      by: ['status'],
      where: { teacherId },
      _count: { id: true },
    });

    return {
      courses: {
        total: totalCourses,
        list: courses,
      },
      schedules: { total: totalSchedules },
      attendances: {
        total: totalAttendances,
        completed: completedAttendances,
        cancelled: cancelledAttendances,
        completionRate:
          totalAttendances > 0
            ? ((completedAttendances / totalAttendances) * 100).toFixed(2) + '%'
            : '0%',
      },
      assignments: {
        byStatus: assignmentStats.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
    };
  }

  /**
   * 获取作业统计数据
   * @param institutionId 机构 ID
   * @param teacherId 教师 ID（可选）
   * @returns 作业统计数据
   */
  async getAssignmentData(institutionId: string, teacherId?: string) {
    const where: any = { institutionId };
    if (teacherId) where.teacherId = teacherId;

    const [
      totalAssignments,
      draftAssignments,
      publishedAssignments,
      closedAssignments,
    ] = await Promise.all([
      this.prisma.assignment.count({ where }),
      this.prisma.assignment.count({ where: { ...where, status: 1 } }),
      this.prisma.assignment.count({ where: { ...where, status: 2 } }),
      this.prisma.assignment.count({ where: { ...where, status: 3 } }),
    ]);

    // 提交统计
    const submissionStats = await this.prisma.submission.aggregate({
      where: {
        assignment: where,
      },
      _count: { id: true },
      _avg: { score: true },
    });

    // 已批改数量
    const gradedCount = await this.prisma.submission.count({
      where: {
        assignment: where,
        status: 2,
      },
    });

    // 按作业类型统计
    const typeStats = await this.prisma.assignment.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
    });

    return {
      assignments: {
        total: totalAssignments,
        draft: draftAssignments,
        published: publishedAssignments,
        closed: closedAssignments,
        byType: typeStats.map((t) => ({
          type: t.type,
          count: t._count.id,
        })),
      },
      submissions: {
        total: submissionStats._count.id,
        graded: gradedCount,
        averageScore: submissionStats._avg.score
          ? Number(Number(submissionStats._avg.score).toFixed(2))
          : null,
      },
    };
  }

  /**
   * 获取学生个人数据统计
   * @param studentId 学生 ID
   * @returns 学生个人统计数据
   */
  async getStudentData(studentId: string) {
    // 获取学生所在班级
    const classEnrollments = await this.prisma.classStudent.findMany({
      where: { studentId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
      },
    });

    const classIds = classEnrollments.map((ce) => ce.classId);

    // 作业统计
    const [totalAssignments, submittedAssignments] = await Promise.all([
      this.prisma.assignment.count({
        where: {
          classId: { in: classIds },
          status: 2,
        },
      }),
      this.prisma.submission.count({
        where: { studentId },
      }),
    ]);

    // 提交成绩统计
    const scoreStats = await this.prisma.submission.aggregate({
      where: {
        studentId,
        score: { not: null },
      },
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true },
      _count: { id: true },
    });

    // 最近提交
    const recentSubmissions = await this.prisma.submission.findMany({
      where: { studentId },
      take: 10,
      orderBy: { submittedAt: 'desc' },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            maxScore: true,
            dueDate: true,
          },
        },
      },
    });

    // 反馈统计
    const feedbackCount = await this.prisma.feedback.count({
      where: { parentId: studentId },
    });

    return {
      classes: classEnrollments.map((ce) => ce.class),
      assignments: {
        total: totalAssignments,
        submitted: submittedAssignments,
        submissionRate:
          totalAssignments > 0
            ? ((submittedAssignments / totalAssignments) * 100).toFixed(2) + '%'
            : '0%',
      },
      scores: {
        average: scoreStats._avg.score
          ? Number(Number(scoreStats._avg.score).toFixed(2))
          : null,
        highest: scoreStats._max.score
          ? Number(scoreStats._max.score)
          : null,
        lowest: scoreStats._min.score
          ? Number(scoreStats._min.score)
          : null,
        gradedCount: scoreStats._count.id,
      },
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        assignment: s.assignment,
        score: s.score,
        status: s.status,
        submittedAt: s.submittedAt,
      })),
      feedbacks: { total: feedbackCount },
    };
  }

  /**
   * 获取学生注册趋势（按月累计）
   * @param institutionId 机构 ID
   * @returns 每月累计学生人数
   */
  async getStudentTrend(institutionId: string): Promise<{ date: string; count: number }[]> {
    try {
      const students = await this.prisma.user.findMany({
        where: {
          institutionId,
          status: 1,
          userRoles: { some: { role: { code: 'STUDENT' } } },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      if (students.length === 0) {
        return [];
      }

      // 按月分组统计
      const monthlyMap = new Map<string, number>();
      for (const student of students) {
        const year = student.createdAt.getFullYear();
        const month = String(student.createdAt.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
      }

      // 按时间排序并计算累计值
      const sortedKeys = [...monthlyMap.keys()].sort();
      let cumulative = 0;
      const result: { date: string; count: number }[] = [];
      for (const key of sortedKeys) {
        cumulative += monthlyMap.get(key)!;
        result.push({ date: key, count: cumulative });
      }

      return result;
    } catch (error) {
      this.logger.error('获取学生注册趋势失败', error);
      return [];
    }
  }

  /**
   * 获取课程分布（按学科统计学生人数）
   * @param institutionId 机构 ID
   * @param teacherId 教师 ID（可选，教师角色时传入）
   * @returns 各学科的课程及学生分布
   */
  async getCourseDistribution(
    institutionId: string,
    teacherId?: string,
  ): Promise<{ name: string; value: number }[]> {
    try {
      const where: any = { institutionId, status: 1 };
      if (teacherId) where.teacherId = teacherId;

      const courses = await this.prisma.course.findMany({
        where,
        include: {
          class: {
            select: {
              _count: { select: { classStudents: true } },
            },
          },
        },
      });

      if (courses.length === 0) {
        return [];
      }

      // 按学科分组，统计学生人数
      const subjectMap = new Map<string, number>();
      for (const course of courses) {
        const subject = course.subject || '未分类';
        const studentCount = course.class._count.classStudents;
        subjectMap.set(subject, (subjectMap.get(subject) || 0) + studentCount);
      }

      return [...subjectMap.entries()].map(([name, value]) => ({ name, value }));
    } catch (error) {
      this.logger.error('获取课程分布失败', error);
      return [];
    }
  }

  /**
   * 获取教师绩效数据
   * @param institutionId 机构 ID
   * @returns 各教师的绩效指标
   */
  async getTeacherPerformance(
    institutionId: string,
  ): Promise<{
    teacherId: string;
    teacherName: string;
    courseCount: number;
    studentCount: number;
    avgScore: number;
    assignmentCount: number;
  }[]> {
    try {
      const teachers = await this.prisma.user.findMany({
        where: {
          institutionId,
          status: 1,
          userRoles: { some: { role: { code: 'TEACHER' } } },
        },
        select: {
          id: true,
          realName: true,
          teachingCourses: {
            where: { status: 1 },
            select: {
              id: true,
              class: {
                select: {
                  _count: { select: { classStudents: true } },
                },
              },
              assignments: {
                select: {
                  submissions: {
                    where: { score: { not: null } },
                    select: { score: true },
                  },
                },
              },
            },
          },
        },
      });

      if (teachers.length === 0) {
        return [];
      }

      return teachers.map((teacher) => {
        let studentCount = 0;
        let totalScore = 0;
        let scoreCount = 0;
        let assignmentCount = 0;

        for (const course of teacher.teachingCourses) {
          studentCount += course.class._count.classStudents;
          assignmentCount += course.assignments.length;
          for (const assignment of course.assignments) {
            for (const submission of assignment.submissions) {
              if (submission.score !== null) {
                totalScore += Number(submission.score);
                scoreCount++;
              }
            }
          }
        }

        return {
          teacherId: teacher.id,
          teacherName: teacher.realName,
          courseCount: teacher.teachingCourses.length,
          studentCount,
          avgScore: scoreCount > 0 ? Number((totalScore / scoreCount).toFixed(2)) : 0,
          assignmentCount,
        };
      });
    } catch (error) {
      this.logger.error('获取教师绩效数据失败', error);
      return [];
    }
  }

  /**
   * 获取营收趋势（基于提交数据的模拟值）
   * 由于没有实际的支付模型，使用提交数量 * 100 作为占位金额
   * @param institutionId 机构 ID
   * @param year 年份（默认当前年）
   * @returns 每月模拟营收数据
   */
  async getRevenueTrend(
    institutionId: string,
    year?: number,
  ): Promise<{ month: string; amount: number }[]> {
    try {
      const targetYear = year || new Date().getFullYear();
      const startDate = new Date(targetYear, 0, 1);
      const endDate = new Date(targetYear + 1, 0, 1);

      // 获取该年度的提交数据
      const submissions = await this.prisma.submission.findMany({
        where: {
          assignment: { institutionId },
          submittedAt: { gte: startDate, lt: endDate },
        },
        select: { submittedAt: true },
      });

      // 按月统计提交数
      const monthlyMap = new Map<string, number>();
      for (const sub of submissions) {
        const yearPart = sub.submittedAt.getFullYear();
        const monthPart = String(sub.submittedAt.getMonth() + 1).padStart(2, '0');
        const key = `${yearPart}-${monthPart}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
      }

      // 生成 12 个月的数据
      const result: { month: string; amount: number }[] = [];
      for (let m = 1; m <= 12; m++) {
        const monthStr = `${targetYear}-${String(m).padStart(2, '0')}`;
        const count = monthlyMap.get(monthStr) || 0;
        result.push({ month: monthStr, amount: count * 100 });
      }

      return result;
    } catch (error) {
      this.logger.error('获取营收趋势失败', error);
      return [];
    }
  }

  /**
   * 获取班级对比数据
   * @param institutionId 机构 ID
   * @returns 各班级的学生数、平均分、及格率
   */
  async getClassComparison(
    institutionId: string,
  ): Promise<{
    className: string;
    studentCount: number;
    avgScore: number;
    passRate: number;
  }[]> {
    try {
      const classes = await this.prisma.class.findMany({
        where: { institutionId, status: 1 },
        select: {
          id: true,
          name: true,
          _count: { select: { classStudents: true } },
          assignments: {
            select: {
              submissions: {
                where: { score: { not: null } },
                select: { score: true },
              },
            },
          },
        },
      });

      if (classes.length === 0) {
        return [];
      }

      return classes.map((cls) => {
        let totalScore = 0;
        let scoreCount = 0;
        let passCount = 0;

        for (const assignment of cls.assignments) {
          for (const submission of assignment.submissions) {
            const score = Number(submission.score);
            totalScore += score;
            scoreCount++;
            if (score >= 60) passCount++;
          }
        }

        return {
          className: cls.name,
          studentCount: cls._count.classStudents,
          avgScore: scoreCount > 0 ? Number((totalScore / scoreCount).toFixed(2)) : 0,
          passRate: scoreCount > 0 ? Number(((passCount / scoreCount) * 100).toFixed(2)) : 0,
        };
      });
    } catch (error) {
      this.logger.error('获取班级对比数据失败', error);
      return [];
    }
  }
}
