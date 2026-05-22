import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(private prisma: PrismaService) {}

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

    if (filters?.status !== undefined && filters?.status !== null) {
      const statusNum = Number(filters.status);
      if (!isNaN(statusNum)) where.status = statusNum;
    }
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.teacherId) where.teacherId = filters.teacherId;
    if (filters?.type !== undefined && filters?.type !== null) {
      const typeNum = Number(filters.type);
      if (!isNaN(typeNum)) where.type = typeNum;
    }
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
        },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return createPaginatedResult(assignments, total, page, pageSize);
  }

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
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found: ' + id);
    }

    return assignment;
  }

  async create(institutionId: string, teacherId: string, dto: CreateAssignmentDto) {
    const cls = await this.prisma.class.findUnique({
      where: { id: dto.classId },
    });
    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new NotFoundException('Course not found');
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
        status: 1,
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

    this.logger.log('Assignment created: ' + dto.title);
    return assignment;
  }

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
      throw new NotFoundException('Assignment not found: ' + id);
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.maxScore !== undefined) updateData.maxScore = data.maxScore;
    if (data.status !== undefined) {
      const statusNum = Number(data.status);
      if (!isNaN(statusNum)) updateData.status = statusNum;
    }

    const assignment = await this.prisma.assignment.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log('Assignment updated: ' + id);
    return assignment;
  }

  async remove(id: string) {
    const existing = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Assignment not found: ' + id);
    }

    await this.prisma.assignment.delete({
      where: { id },
    });

    this.logger.log('Assignment deleted: ' + id);
  }

  async publish(id: string) {
    const existing = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Assignment not found: ' + id);
    }

    const assignment = await this.prisma.assignment.update({
      where: { id },
      data: { status: 2 },
    });

    this.logger.log('Assignment published: ' + id);
    return assignment;
  }

  async getStatistics(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            classStudents: true,
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
      throw new NotFoundException('Assignment not found: ' + id);
    }

    const totalStudents = assignment.class.classStudents.length;
    const submittedCount = assignment.submissions.length;
    const gradedCount = assignment.submissions.filter((s) => s.status === 2).length;

    const gradedScores = assignment.submissions
      .filter((s) => s.score !== null)
      .map((s) => Number(s.score));

    const averageScore =
      gradedScores.length > 0
        ? gradedScores.reduce((sum, score) => sum + score, 0) / gradedScores.length
        : null;

    const scoreRanges = {
      excellent: 0,
      good: 0,
      average: 0,
      fail: 0,
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
