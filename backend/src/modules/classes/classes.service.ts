import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

/**
 * 班级服务
 * 处理班级 CRUD、学生管理等业务逻辑
 */
@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取班级列表（分页）
   * @param institutionId 机构 ID
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页班级列表
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      keyword?: string;
      grade?: string;
      status?: number;
      homeroomTeacherId?: string;
    },
  ) {
    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto || {};

    // 构建查询条件
    const where: any = { institutionId };

    if (filters?.status != null && filters?.status !== '' && !isNaN(Number(filters.status))) {
      where.status = Number(filters.status);
    }

    if (filters?.grade) {
      where.grade = filters.grade;
    }

    if (filters?.homeroomTeacherId) {
      where.homeroomTeacherId = filters.homeroomTeacherId;
    }

    if (filters?.keyword) {
      where.OR = [
        { name: { contains: filters.keyword, mode: 'insensitive' } },
        { description: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          homeroomTeacher: {
            select: {
              id: true,
              realName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              classStudents: true,
              courses: true,
            },
          },
        },
      }),
      this.prisma.class.count({ where }),
    ]);

    // 格式化数据
    const formattedClasses = classes.map((cls) => ({
      ...cls,
      studentCount: cls._count.classStudents,
      courseCount: cls._count.courses,
      _count: undefined,
    }));

    return createPaginatedResult(formattedClasses, total, page, pageSize);
  }

  /**
   * 获取班级详情
   * @param id 班级 ID
   * @returns 班级详细信息
   */
  async findById(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        homeroomTeacher: {
          select: {
            id: true,
            realName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        classStudents: {
          include: {
            student: {
              select: {
                id: true,
                username: true,
                realName: true,
                phone: true,
                avatarUrl: true,
                gender: true,
              },
            },
            parent: {
              select: {
                id: true,
                realName: true,
                phone: true,
              },
            },
          },
        },
        courses: {
          select: {
            id: true,
            name: true,
            subject: true,
            status: true,
          },
        },
        _count: {
          select: {
            classStudents: true,
            courses: true,
            assignments: true,
          },
        },
      },
    });

    if (!cls) {
      throw new NotFoundException(`班级不存在: ${id}`);
    }

    return {
      ...cls,
      studentCount: cls._count.classStudents,
      courseCount: cls._count.courses,
      assignmentCount: cls._count.assignments,
      students: cls.classStudents.map((cs) => ({
        enrolledAt: cs.enrolledAt,
        student: cs.student,
        parent: cs.parent,
      })),
      classStudents: undefined,
      _count: undefined,
    };
  }

  /**
   * 创建班级
   * @param institutionId 机构 ID
   * @param dto 创建数据
   * @returns 创建的班级信息
   */
  async create(institutionId: string, dto: CreateClassDto) {
    // 检查同名班级
    const existingClass = await this.prisma.class.findFirst({
      where: {
        institutionId,
        name: dto.name,
      },
    });

    if (existingClass) {
      throw new ConflictException('同名班级已存在');
    }

    // 如果指定了班主任，验证教师是否存在
    if (dto.homeroomTeacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: dto.homeroomTeacherId },
      });

      if (!teacher) {
        throw new NotFoundException('指定的班主任不存在');
      }
    }

    const cls = await this.prisma.class.create({
      data: {
        institutionId,
        name: dto.name,
        grade: dto.grade,
        description: dto.description,
        homeroomTeacherId: dto.homeroomTeacherId,
        maxStudents: dto.maxStudents || 50,
        status: 1,
      },
      include: {
        homeroomTeacher: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`班级创建成功: ${dto.name}`);

    return cls;
  }

  /**
   * 更新班级信息
   * @param id 班级 ID
   * @param dto 更新数据
   * @returns 更新后的班级信息
   */
  async update(id: string, dto: UpdateClassDto) {
    const existing = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`班级不存在: ${id}`);
    }

    // 如果修改了名称，检查是否重名
    if (dto.name && dto.name !== existing.name) {
      const duplicateName = await this.prisma.class.findFirst({
        where: {
          institutionId: existing.institutionId,
          name: dto.name,
          id: { not: id },
        },
      });

      if (duplicateName) {
        throw new ConflictException('同名班级已存在');
      }
    }

    const cls = await this.prisma.class.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.grade !== undefined && { grade: dto.grade }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.homeroomTeacherId !== undefined && { homeroomTeacherId: dto.homeroomTeacherId }),
        ...(dto.maxStudents !== undefined && { maxStudents: dto.maxStudents }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        homeroomTeacher: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`班级更新成功: ${id}`);

    return cls;
  }

  /**
   * 删除班级（软删除）
   * @param id 班级 ID
   */
  async remove(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classStudents: true,
            courses: true,
          },
        },
      },
    });

    if (!cls) {
      throw new NotFoundException(`班级不存在: ${id}`);
    }

    // 检查班级是否有学生
    if (cls._count.classStudents > 0) {
      throw new BadRequestException('该班级还有学生，请先移除所有学生后再删除');
    }

    // 检查班级是否有课程
    if (cls._count.courses > 0) {
      throw new BadRequestException('该班级还有关联课程，请先处理课程后再删除');
    }

    // 软删除：设置状态为停用
    await this.prisma.class.update({
      where: { id },
      data: { status: 0 },
    });

    this.logger.log(`班级已停用: ${id}`);
  }

  /**
   * 添加学生到班级
   * @param classId 班级 ID
   * @param studentId 学生 ID
   * @param parentId 家长 ID（可选）
   */
  async addStudent(classId: string, studentId: string, parentId?: string) {
    // 验证班级
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: { select: { classStudents: true } },
      },
    });

    if (!cls) {
      throw new NotFoundException(`班级不存在: ${classId}`);
    }

    if (cls.status !== 1) {
      throw new BadRequestException('班级已停用，无法添加学生');
    }

    // 检查班级人数上限
    if (cls._count.classStudents >= cls.maxStudents) {
      throw new BadRequestException('班级学生人数已达上限');
    }

    // 验证学生用户
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('学生用户不存在');
    }

    // 检查是否已在班级中
    const existingEnrollment = await this.prisma.classStudent.findUnique({
      where: {
        classId_studentId: { classId, studentId },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('该学生已在班级中');
    }

    // 如果指定了家长，验证家长用户
    if (parentId) {
      const parent = await this.prisma.user.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException('家长用户不存在');
      }
    }

    await this.prisma.classStudent.create({
      data: {
        classId,
        studentId,
        parentId,
      },
    });

    this.logger.log(`学生 ${studentId} 添加到班级 ${classId}`);

    return { message: '学生添加成功' };
  }

  /**
   * 从班级移除学生
   * @param classId 班级 ID
   * @param studentId 学生 ID
   */
  async removeStudent(classId: string, studentId: string) {
    const enrollment = await this.prisma.classStudent.findUnique({
      where: {
        classId_studentId: { classId, studentId },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('该学生不在该班级中');
    }

    await this.prisma.classStudent.delete({
      where: {
        classId_studentId: { classId, studentId },
      },
    });

    this.logger.log(`学生 ${studentId} 已从班级 ${classId} 移除`);

    return { message: '学生移除成功' };
  }

  /**
   * 获取班级学生列表
   * @param classId 班级 ID
   * @returns 学生列表
   */
  async getStudents(classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!cls) {
      throw new NotFoundException(`班级不存在: ${classId}`);
    }

    const students = await this.prisma.classStudent.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            realName: true,
            phone: true,
            email: true,
            avatarUrl: true,
            gender: true,
            status: true,
          },
        },
        parent: {
          select: {
            id: true,
            realName: true,
            phone: true,
          },
        },
      },
      orderBy: { enrolledAt: 'asc' },
    });

    return students.map((cs) => ({
      enrolledAt: cs.enrolledAt,
      student: cs.student,
      parent: cs.parent,
    }));
  }
}
