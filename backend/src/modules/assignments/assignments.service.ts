import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

/**
 * 作业服务
 * 处理作业 CRUD、发布、统计等业务逻辑
 *
 * 作业类型：
 * - 1: 日常作业
 * - 2: 测验
 * - 3: 考试
 *
 * 作业状态：
 * - 1: 草稿
 * - 2: 已发布
 * - 3: 已截止
 */
@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取作业列表（分页）
   * @param institutionId 机构 ID
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页作业列表
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      keyword?: string;
      classId?: string;
      courseId?: string;
      teacherId?: string;
      type?: number;
      status?: number;
      subject?: string;
    },
  ) {
    const page = Number(paginationDto?.page) || 1;
    const pageSize = Number(paginationDto?.pageSize) || 10;
    const sortBy = paginationDto?.sortBy || 'createdAt';
    const sortOrder = paginationDto?.sortOrder || 'desc';

    const where: any = { institutionId };

    if (filters?.status !== undefined && filters?.status !== null) where.status = Number(filters.status);
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.teacherId) where.teacherId = filters.teacherId;
    if (filters?.type !== undefined && filters?.type !== null) where.type = Number(filters.type);
    if (filters?.subject) where.subject = filters.subject;

    if (filters?.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { description: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          class: {
            select: { id: true, name: true, grade: true },
          },
          course: {
            select: { id: true, name: true, subject: true },
          },
          teacher: {
            select: { id: true, realName: true, avatarUrl: true },
          },
          _count: {
            select: { submissions: true },
          },
        },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    const formattedAssignments = assignments.map((a) => ({
      ...a,
      submissionCount: a._count.submissions,
      _count: undefined,
    }));

    return createPaginatedResult(formattedAssignments, total, page, pageSize);
  }

  /**
   * 获取作业详情
   * @param id 作业 ID
   * @returns 作业详细信息
   */
  async findById(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        class: {
          select: { id: true, name: true, grade: true },
        },
        course: {
          select: { id: true, name: true, subject: true },
        },
        teacher: {
          select: { id: true, realName: true, avatarUrl: true },
        },
        submissions: {
          include: {
            student: {
              select: { id: true, realName: true, avatarUrl: true },
            },
            grader: {
              select: { id: true, realName: true },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`作业不存在: ${id}`);
    }

    return {
      ...assignment,
      submissionCount: assignment._count.submissions,
      _count: undefined,
    };
  }

  /**
   * 创建作业
   * @param institutionId 机构 ID
   * @param teacherId 教师 ID
   * @param dto 创建数据
   * @returns 创建的作业信息
   */
  async create(institutionId: string, teacherId: string, dto: CreateAssignmentDto) {
    // 验证班级
    const cls = await this.prisma.class.findUnique({
      where: { id: dto.classId },
    });

    if (!cls) {
      throw new NotFoundException('指定的班级不存在');
    }

    // 验证课程（如果指定）
    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });

      if (!course) {
        throw new NotFoundException('指定的课程不存在');
      }
    }

    const assignment = await this.prisma.assignment.create({
      data: {
        institutionId,
        classId: dto.classId,
        courseId: dto.courseId,
        teacherId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        subject: dto.subject,
        attachments: dto.attachments || undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        maxScore: dto.maxScore || 100,
        status: 1, // 默认为草稿状态
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
        teacher: {
          select: { id: true, realName: true },
        },
      },
    });

    this.logger.log(`作业创建成功: ${dto.title}`);

    return assignment;
  }

  /**
   * 更新作业信息
   * @param id 作业 ID
   * @param data 更新数据
   * @returns 更新后的作业信息
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      type?: number;
      subject?: string;
      attachments?: any[];
      dueDate?: string;
      maxScore?: number;
      status?: number;
    },
  ) {
    const existing = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`作业不存在: ${id}`);
    }

    const assignment = await this.prisma.assignment.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.attachments !== undefined && { attachments: data.attachments }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.maxScore !== undefined && { maxScore: data.maxScore }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`作业更新成功: ${id}`);

    return assignment;
  }

  /**
   * 删除作业（软删除）
   * @param id 作业 ID
   */
  async remove(id: string) {
    const existing = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`作业不存在: ${id}`);
    }

    if (existing._count.submissions > 0) {
      // 有提交记录时软删除
      await this.prisma.assignment.update({
        where: { id },
        data: { status: 0 },
      });
    } else {
      // 没有提交记录时可直接删除
      await this.prisma.assignment.delete({
        where: { id },
      });
    }

    this.logger.log(`作业已删除: ${id}`);
  }

  /**
   * 发布作业（状态改为已发布）
   * @param id 作业 ID
   * @returns 更新后的作业信息
   */
  async publish(id: string) {
    const existing = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`作业不存在: ${id}`);
    }

    const assignment = await this.prisma.assignment.update({
      where: { id },
      data: { status: 2 },
    });

    this.logger.log(`作业已发布: ${id}`);

    return assignment;
  }

  /**
   * 获取作业统计信息
   * @param id 作业 ID
   * @returns 统计数据
   */
  async getStatistics(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            _count: { select: { classStudents: true } },
          },
        },
        submissions: {
          select: {
            score: true,
            status: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`作业不存在: ${id}`);
    }

    const totalStudents = assignment.class._count.classStudents;
    const submittedCount = assignment.submissions.length;
    const gradedCount = assignment.submissions.filter((s) => s.status === 2).length;

    // 计算平均分
    const gradedScores = assignment.submissions
      .filter((s) => s.score !== null)
      .map((s) => Number(s.score));

    const averageScore =
      gradedScores.length > 0
        ? gradedScores.reduce((sum, score) => sum + score, 0) / gradedScores.length
        : null;

    // 分数段统计
    const scoreRanges = {
      excellent: 0, // 90-100
      good: 0,      // 80-89
      average: 0,   // 60-79
      fail: 0,      // 0-59
    };

    gradedScores.forEach((score) => {
      if (score >= 90) scoreRanges.excellent++;
      else if (score >= 80) scoreRanges.good++;
      else if (score >= 60) scoreRanges.average++;
      else scoreRanges.fail++;
    });

    return {
      assignmentId: id,
      totalStudents,
      submittedCount,
      unsubmittedCount: totalStudents - submittedCount,
      gradedCount,
      ungradedCount: submittedCount - gradedCount,
      submissionRate: totalStudents > 0
        ? ((submittedCount / totalStudents) * 100).toFixed(2) + '%'
        : '0%',
      averageScore: averageScore !== null ? Number(averageScore.toFixed(2)) : null,
      scoreRanges,
    };
  }
}
