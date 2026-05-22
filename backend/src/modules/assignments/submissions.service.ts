import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

/**
 * 作业提交服务
 * 处理作业提交、批改等业务逻辑
 *
 * 提交状态：
 * - 1: 已提交（待批改）
 * - 2: 已批改
 * - 3: 已退回（需重新提交）
 */
@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取作业提交列表（分页）
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页提交列表
   */
  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      assignmentId?: string;
      studentId?: string;
      status?: number;
    },
  ) {
    const { page, pageSize, sortBy = 'submittedAt', sortOrder } = paginationDto;

    const where: any = {};

    if (filters?.assignmentId) where.assignmentId = filters.assignmentId;
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.status != null && filters?.status !== '' && !isNaN(Number(filters.status))) where.status = Number(filters.status);

    const orderBy: any = { [sortBy]: sortOrder };

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              type: true,
              maxScore: true,
              dueDate: true,
              class: {
                select: { id: true, name: true },
              },
            },
          },
          student: {
            select: {
              id: true,
              realName: true,
              avatarUrl: true,
            },
          },
          grader: {
            select: {
              id: true,
              realName: true,
            },
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return createPaginatedResult(submissions, total, page, pageSize);
  }

  /**
   * 提交作业
   * @param assignmentId 作业 ID
   * @param studentId 学生 ID
   * @param dto 提交数据
   * @returns 提交记录
   */
  async submit(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    // 验证作业是否存在且已发布
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('作业不存在');
    }

    if (assignment.status !== 2) {
      throw new BadRequestException('作业未发布，无法提交');
    }

    // 检查截止时间
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      // 超过截止时间仍允许提交，但标记为迟交
      this.logger.warn(`学生 ${studentId} 迟交作业 ${assignmentId}`);
    }

    // 检查是否已提交
    const existingSubmission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (existingSubmission) {
      // 如果已退回，允许重新提交
      if (existingSubmission.status !== 3) {
        throw new ConflictException('您已提交过该作业');
      }

      // 更新退回的提交
      const submission = await this.prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content: dto.content,
          attachments: dto.attachments || undefined,
          status: 1,
          submittedAt: new Date(),
          score: null,
          grade: null,
          comment: null,
          gradedAt: null,
          gradedBy: null,
        },
        include: {
          assignment: {
            select: { id: true, title: true },
          },
        },
      });

      this.logger.log(`学生 ${studentId} 重新提交作业 ${assignmentId}`);

      return submission;
    }

    // 创建新提交
    const submission = await this.prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        content: dto.content,
        attachments: dto.attachments || undefined,
        status: 1,
      },
      include: {
        assignment: {
          select: { id: true, title: true },
        },
      },
    });

    this.logger.log(`学生 ${studentId} 提交作业 ${assignmentId}`);

    return submission;
  }

  /**
   * 批改作业提交
   * @param submissionId 提交 ID
   * @param graderId 批改者 ID
   * @param dto 批改数据
   * @returns 批改后的提交记录
   */
  async grade(submissionId: string, graderId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: { id: true, maxScore: true },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('提交记录不存在');
    }

    // 验证分数不超过满分
    if (dto.score > Number(submission.assignment.maxScore)) {
      throw new BadRequestException(
        `得分不能超过满分 ${submission.assignment.maxScore}`,
      );
    }

    const updatedSubmission = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        grade: dto.grade,
        comment: dto.comment,
        status: 2,
        gradedAt: new Date(),
        gradedBy: graderId,
      },
      include: {
        assignment: {
          select: { id: true, title: true, maxScore: true },
        },
        student: {
          select: { id: true, realName: true },
        },
        grader: {
          select: { id: true, realName: true },
        },
      },
    });

    this.logger.log(`作业提交 ${submissionId} 已批改，得分: ${dto.score}`);

    return updatedSubmission;
  }

  /**
   * 获取学生在某作业的提交
   * @param assignmentId 作业 ID
   * @param studentId 学生 ID
   * @returns 提交记录或 null
   */
  async findByStudentAndAssignment(assignmentId: string, studentId: string) {
    return this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            dueDate: true,
          },
        },
        grader: {
          select: { id: true, realName: true },
        },
      },
    });
  }

  /**
   * 获取学生的所有提交
   * @param studentId 学生 ID
   * @param paginationDto 分页参数
   * @returns 分页提交列表
   */
  async findByStudent(studentId: string, paginationDto: PaginationDto) {
    return this.findAll(paginationDto, { studentId });
  }
}
