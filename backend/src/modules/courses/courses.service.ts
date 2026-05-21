import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateCourseDto } from './dto/create-course.dto';

/**
 * 课程服务
 * 处理课程 CRUD、课时统计等业务逻辑
 */
@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取课程列表（分页）
   * @param institutionId 机构 ID
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页课程列表
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      keyword?: string;
      classId?: string;
      teacherId?: string;
      subject?: string;
      status?: number;
    },
  ) {
    const { page, pageSize, sortBy = 'createdAt', sortOrder } = paginationDto;

    const where: any = { institutionId };

    if (filters?.status !== undefined) {
      where.status = filters.status;
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.subject) {
      where.subject = filters.subject;
    }

    if (filters?.keyword) {
      where.OR = [
        { name: { contains: filters.keyword, mode: 'insensitive' } },
        { subject: { contains: filters.keyword, mode: 'insensitive' } },
        { description: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
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
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              schedules: true,
              attendances: true,
              assignments: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const formattedCourses = courses.map((course) => ({
      ...course,
      scheduleCount: course._count.schedules,
      attendanceCount: course._count.attendances,
      assignmentCount: course._count.assignments,
      _count: undefined,
    }));

    return createPaginatedResult(formattedCourses, total, page, pageSize);
  }

  /**
   * 获取课程详情
   * @param id 课程 ID
   * @returns 课程详细信息
   */
  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
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
            phone: true,
            avatarUrl: true,
          },
        },
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        _count: {
          select: {
            schedules: true,
            attendances: true,
            assignments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`课程不存在: ${id}`);
    }

    return {
      ...course,
      scheduleCount: course._count.schedules,
      attendanceCount: course._count.attendances,
      assignmentCount: course._count.assignments,
      _count: undefined,
    };
  }

  /**
   * 创建课程
   * @param institutionId 机构 ID
   * @param dto 创建数据
   * @returns 创建的课程信息
   */
  async create(institutionId: string, dto: CreateCourseDto) {
    // 验证班级是否存在
    const cls = await this.prisma.class.findUnique({
      where: { id: dto.classId },
    });

    if (!cls) {
      throw new NotFoundException('指定的班级不存在');
    }

    // 验证教师是否存在
    const teacher = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('指定的教师不存在');
    }

    const course = await this.prisma.course.create({
      data: {
        institutionId,
        classId: dto.classId,
        teacherId: dto.teacherId,
        name: dto.name,
        subject: dto.subject,
        description: dto.description,
        totalHours: dto.totalHours || 0,
        completedHours: 0,
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

    this.logger.log(`课程创建成功: ${dto.name}`);

    return course;
  }

  /**
   * 更新课程信息
   * @param id 课程 ID
   * @param data 更新数据
   * @returns 更新后的课程信息
   */
  async update(
    id: string,
    data: {
      name?: string;
      subject?: string;
      description?: string;
      totalHours?: number;
      teacherId?: string;
      status?: number;
    },
  ) {
    const existing = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`课程不存在: ${id}`);
    }

    if (data.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: data.teacherId },
      });

      if (!teacher) {
        throw new NotFoundException('指定的教师不存在');
      }
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.totalHours !== undefined && { totalHours: data.totalHours }),
        ...(data.teacherId !== undefined && { teacherId: data.teacherId }),
        ...(data.status !== undefined && { status: data.status }),
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

    this.logger.log(`课程更新成功: ${id}`);

    return course;
  }

  /**
   * 删除课程（软删除）
   * @param id 课程 ID
   */
  async remove(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`课程不存在: ${id}`);
    }

    if (course._count.attendances > 0) {
      // 有上课记录的课程只软删除
      await this.prisma.course.update({
        where: { id },
        data: { status: 0 },
      });
    } else {
      // 没有上课记录可以直接删除
      await this.prisma.course.delete({
        where: { id },
      });
    }

    this.logger.log(`课程已删除: ${id}`);
  }

  /**
   * 获取教师的课程列表
   * @param teacherId 教师 ID
   * @returns 课程列表
   */
  async findByTeacher(teacherId: string) {
    return this.prisma.course.findMany({
      where: {
        teacherId,
        status: 1,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        _count: {
          select: {
            schedules: true,
            attendances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 增加已完成课时
   * @param courseId 课程 ID
   */
  async incrementCompletedHours(courseId: string) {
    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        completedHours: {
          increment: 1,
        },
      },
    });
  }
}
