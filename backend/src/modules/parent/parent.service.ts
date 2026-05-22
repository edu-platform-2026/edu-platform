import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentService {
  private readonly logger = new Logger(ParentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get students bound to a parent
   */
  async getBoundStudents(parentId: string) {
    const bindings = await this.prisma.classStudent.findMany({
      where: { parentId },
      include: {
        student: {
          select: { id: true, username: true, realName: true, avatarUrl: true, phone: true, email: true },
        },
        class: {
          select: { id: true, name: true, grade: true },
        },
      },
    });

    // Group by student (a student can be in multiple classes)
    const studentMap = new Map<string, any>();
    for (const binding of bindings) {
      const sid = binding.studentId;
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          ...binding.student,
          classes: [],
        });
      }
      studentMap.get(sid).classes.push(binding.class);
    }

    return Array.from(studentMap.values());
  }

  /**
   * Search students by username or realName
   */
  async searchStudents(keyword: string, institutionId: string) {
    const students = await this.prisma.user.findMany({
      where: {
        institutionId,
        status: 1,
        userRoles: {
          some: {
            role: { code: 'STUDENT' },
          },
        },
        OR: [
          { username: { contains: keyword, mode: 'insensitive' } },
          { realName: { contains: keyword, mode: 'insensitive' } },
          { phone: { contains: keyword } },
        ],
      },
      select: { id: true, username: true, realName: true, avatarUrl: true, phone: true },
      take: 20,
    });
    return students;
  }

  /**
   * Bind parent to a student (update ClassStudent.parentId)
   */
  async bindStudent(parentId: string, studentId: string) {
    // Find all class enrollments for this student
    const enrollments = await this.prisma.classStudent.findMany({
      where: { studentId },
    });

    if (enrollments.length === 0) {
      throw new NotFoundException('璇ュ鐢熷皻鏈姞鍏ヤ换浣曠彮绾?);
    }

    // Check if already bound
    const alreadyBound = enrollments.some(e => e.parentId === parentId);
    if (alreadyBound) {
      throw new ConflictException('宸茬粡缁戝畾杩囪瀛︾敓');
    }

    // Update all class enrollments for this student to add parent
    await this.prisma.classStudent.updateMany({
      where: { studentId },
      data: { parentId },
    });

    this.logger.log(`Parent ${parentId} bound to student ${studentId}`);
    return { message: '缁戝畾鎴愬姛', studentId };
  }

  /**
   * Unbind parent from a student
   */
  async unbindStudent(parentId: string, studentId: string) {
    await this.prisma.classStudent.updateMany({
      where: { studentId, parentId },
      data: { parentId: null },
    });

    this.logger.log(`Parent ${parentId} unbound from student ${studentId}`);
    return { message: '瑙ｇ粦鎴愬姛', studentId };
  }

  /**
   * Get student's assignments (for parent to view)
   */
  async getStudentAssignments(studentId: string) {
    // Get student's class IDs
    const enrollments = await this.prisma.classStudent.findMany({
      where: { studentId },
      select: { classId: true },
    });
    const classIds = enrollments.map(e => e.classId);

    // Get assignments for those classes
    const assignments = await this.prisma.assignment.findMany({
      where: {
        classId: { in: classIds },
        status: 2, // published
      },
      include: {
        course: { select: { id: true, name: true, subject: true } },
        submissions: {
          where: { studentId },
          select: { id: true, score: true, status: true, submittedAt: true, gradedAt: true, comment: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      courseName: a.course?.name || '-',
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      submission: a.submissions[0] || null,
    }));
  }

  /**
   * Get student's progress/grades summary
   */
  async getStudentProgress(studentId: string) {
    const enrollments = await this.prisma.classStudent.findMany({
      where: { studentId },
      select: { classId: true },
    });
    const classIds = enrollments.map(e => e.classId);

    // Get all submissions with scores
    const submissions = await this.prisma.submission.findMany({
      where: {
        studentId,
        score: { not: null },
      },
      include: {
        assignment: {
          select: { id: true, title: true, maxScore: true, courseId: true, course: { select: { name: true } } },
        },
      },
      orderBy: { gradedAt: 'desc' },
    });

    // Calculate averages
    const scores = submissions.map(s => Number(s.score));
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Group by course
    const courseMap = new Map<string, { name: string; scores: number[] }>();
    for (const sub of submissions) {
      const courseName = sub.assignment.course?.name || '鏈煡璇剧▼';
      const courseId = sub.assignment.courseId || 'unknown';
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, { name: courseName, scores: [] });
      }
      courseMap.get(courseId)!.scores.push(Number(sub.score));
    }

    const courseStats = Array.from(courseMap.entries()).map(([id, data]) => ({
      courseId: id,
      courseName: data.name,
      count: data.scores.length,
      avgScore: Number((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)),
    }));

    return {
      totalSubmissions: submissions.length,
      averageScore: Number(avgScore.toFixed(1)),
      courseStats,
      recentGrades: submissions.slice(0, 10).map(s => ({
        assignmentTitle: s.assignment.title,
        courseName: s.assignment.course?.name || '-',
        score: Number(s.score),
        maxScore: Number(s.assignment.maxScore),
        gradedAt: s.gradedAt,
      })),
    };
  }
}