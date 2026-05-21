import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

/**
 * 上课记录服务
 * 处理上课记录、考勤统计等业务逻辑
 *
 * 状态说明：
 * - 1: 已完成
 * - 2: 已取消
 * - 3: 补课
 */
@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * 获取上课记录列表（分页）
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页上课记录列表
   */
  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      courseId?: string;
      scheduleId?: string;
      teacherId?: string;
      startDate?: string;
      endDate?: string;
      status?: number;
    },
  ) {
    const { page, pageSize, sortBy = 'actualDate', sortOrder = 'desc' } = paginationDto;

    const where: any = {};

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }

    if (filters?.scheduleId) {
      where.scheduleId = filters.scheduleId;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.status !== undefined) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.actualDate = {};
      if (filters.startDate) {
        where.actualDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.actualDate.lte = new Date(filters.endDate);
      }
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          course: {
            select: {
              id: true,
              name: true,
              subject: true,
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          schedule: {
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              room: true,
            },
          },
          teacher: {
            select: {
              id: true,
              realName: true,
            },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return createPaginatedResult(attendances, total, page, pageSize);
  }

  /**
   * 创建上课记录
   * @param teacherId 当前教师 ID
   * @param dto 创建数据
   * @returns 创建的上课记录
   */
  async create(teacherId: string, dto: CreateAttendanceDto) {
    // 验证排课是否存在
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: dto.scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('排课记录不存在');
    }

    // 验证课程是否存在
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    // 检查同一天是否已有记录
    const existingRecord = await this.prisma.attendance.findFirst({
      where: {
        scheduleId: dto.scheduleId,
        actualDate: new Date(dto.actualDate),
      },
    });

    if (existingRecord) {
      throw new BadRequestException('该排课在该日期已有上课记录');
    }

    // 构建时间对象
    const startTime = dto.startTime ? new Date(`1970-01-01T${dto.startTime}:00`) : null;
    const endTime = dto.endTime ? new Date(`1970-01-01T${dto.endTime}:00`) : null;

    const attendance = await this.prisma.$transaction(async (tx) => {
      // 创建上课记录
      const record = await tx.attendance.create({
        data: {
          scheduleId: dto.scheduleId,
          courseId: dto.courseId,
          teacherId,
          actualDate: new Date(dto.actualDate),
          startTime,
          endTime,
          status: dto.status || 1,
          feedback: dto.feedback,
        },
        include: {
          course: {
            select: { id: true, name: true, subject: true },
          },
          schedule: {
            select: { id: true, dayOfWeek: true, room: true },
          },
        },
      });

      // 如果是完成状态，增加课程已完成课时
      if (dto.status === 1 || dto.status === 3) {
        await tx.course.update({
          where: { id: dto.courseId },
          data: {
            completedHours: {
              increment: 1,
            },
          },
        });
      }

      return record;
    });

    this.logger.log(`上课记录创建成功: 课程 ${dto.courseId} 日期 ${dto.actualDate}`);

    return attendance;
  }

  /**
   * 更新上课记录
   * @param id 记录 ID
   * @param data 更新数据
   * @returns 更新后的上课记录
   */
  async update(
    id: string,
    data: {
      startTime?: string;
      endTime?: string;
      status?: number;
      feedback?: string;
    },
  ) {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`上课记录不存在: ${id}`);
    }

    const updateData: any = {};

    if (data.startTime) updateData.startTime = new Date(`1970-01-01T${data.startTime}:00`);
    if (data.endTime) updateData.endTime = new Date(`1970-01-01T${data.endTime}:00`);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.feedback !== undefined) updateData.feedback = data.feedback;

    const attendance = await this.prisma.attendance.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`上课记录更新成功: ${id}`);

    return attendance;
  }

  /**
   * 获取上课统计信息
   * @param courseId 课程 ID（可选）
   * @param teacherId 教师 ID（可选）
   * @returns 统计数据
   */
  async getStatistics(filters?: { courseId?: string; teacherId?: string }) {
    const where: any = {};

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    const [total, completed, cancelled, makeup] = await Promise.all([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.count({ where: { ...where, status: 1 } }),
      this.prisma.attendance.count({ where: { ...where, status: 2 } }),
      this.prisma.attendance.count({ where: { ...where, status: 3 } }),
    ]);

    return {
      total,
      completed,
      cancelled,
      makeup,
      completionRate: total > 0 ? ((completed + makeup) / total * 100).toFixed(2) + '%' : '0%',
    };
  }
}
