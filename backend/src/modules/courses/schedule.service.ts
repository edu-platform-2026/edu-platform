import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';

/**
 * 排课服务
 * 处理课程排课、课表查询等业务逻辑
 */
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取排课列表（分页）
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页排课列表
   */
  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      courseId?: string;
      dayOfWeek?: number;
      teacherId?: string;
    },
  ) {
    const { page, pageSize, sortBy = 'dayOfWeek', sortOrder = 'asc' } = paginationDto;

    const where: any = {};

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }

    if (filters?.dayOfWeek) {
      where.dayOfWeek = filters.dayOfWeek;
    }

    // 如果指定了教师 ID，筛选该教师的课程排课
    if (filters?.teacherId) {
      where.course = {
        teacherId: filters.teacherId,
      };
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [schedules, total] = await Promise.all([
      this.prisma.schedule.findMany({
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
                  grade: true,
                },
              },
              teacher: {
                select: {
                  id: true,
                  realName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return createPaginatedResult(schedules, total, page, pageSize);
  }

  /**
   * 获取当前教师的排课列表
   * @param teacherId 教师 ID
   * @returns 排课列表
   */
  async findMySchedules(teacherId: string) {
    return this.prisma.schedule.findMany({
      where: {
        course: {
          teacherId,
          status: 1,
        },
      },
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
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * 创建排课
   * @param dto 创建数据
   * @returns 创建的排课信息
   */
  async create(dto: CreateScheduleDto) {
    // 验证课程是否存在
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    // 验证时间
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('下课时间必须晚于上课时间');
    }

    // 检查是否与现有排课冲突（同一课程、同一天、时间重叠）
    const conflict = await this.prisma.schedule.findFirst({
      where: {
        courseId: dto.courseId,
        dayOfWeek: dto.dayOfWeek,
        startTime: { lt: new Date(`1970-01-01T${dto.endTime}:00`) },
        endTime: { gt: new Date(`1970-01-01T${dto.startTime}:00`) },
      },
    });

    if (conflict) {
      throw new BadRequestException('该时间段已有排课，存在冲突');
    }

    // 构建时间对象（用于 Time 类型字段）
    const startTime = new Date(`1970-01-01T${dto.startTime}:00`);
    const endTime = new Date(`1970-01-01T${dto.endTime}:00`);

    const schedule = await this.prisma.schedule.create({
      data: {
        courseId: dto.courseId,
        dayOfWeek: dto.dayOfWeek,
        startTime,
        endTime,
        room: dto.room,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    this.logger.log(`排课创建成功: 课程 ${dto.courseId} 星期${dto.dayOfWeek}`);

    return schedule;
  }

  /**
   * 更新排课
   * @param id 排课 ID
   * @param data 更新数据
   * @returns 更新后的排课信息
   */
  async update(
    id: string,
    data: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      room?: string;
      effectiveFrom?: string;
      effectiveUntil?: string;
    },
  ) {
    const existing = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`排课不存在: ${id}`);
    }

    // 验证时间
    const startTimeStr = data.startTime || '00:00';
    const endTimeStr = data.endTime || '00:00';

    if (data.startTime && data.endTime && startTimeStr >= endTimeStr) {
      throw new BadRequestException('下课时间必须晚于上课时间');
    }

    const updateData: any = {};

    if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
    if (data.startTime) updateData.startTime = new Date(`1970-01-01T${data.startTime}:00`);
    if (data.endTime) updateData.endTime = new Date(`1970-01-01T${data.endTime}:00`);
    if (data.room !== undefined) updateData.room = data.room;
    if (data.effectiveFrom) updateData.effectiveFrom = new Date(data.effectiveFrom);
    if (data.effectiveUntil) updateData.effectiveUntil = new Date(data.effectiveUntil);

    const schedule = await this.prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    this.logger.log(`排课更新成功: ${id}`);

    return schedule;
  }

  /**
   * 删除排课
   * @param id 排课 ID
   */
  async remove(id: string) {
    const existing = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        _count: {
          select: { attendances: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`排课不存在: ${id}`);
    }

    if (existing._count.attendances > 0) {
      throw new BadRequestException('该排课已有上课记录，无法删除');
    }

    await this.prisma.schedule.delete({
      where: { id },
    });

    this.logger.log(`排课已删除: ${id}`);
  }
}
