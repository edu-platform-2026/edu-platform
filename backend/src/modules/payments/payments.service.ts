import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Role } from '../../common/enums/role.enum';

/**
 * 缴费管理服务
 * 处理缴费记录 CRUD、确认缴费等业务逻辑
 *
 * 缴费类型：
 * - 1: 学费
 * - 2: 教材费
 * - 3: 考试费
 * - 4: 其他
 *
 * 缴费状态：
 * - 1: 待缴费
 * - 2: 已缴费
 * - 3: 已退款
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取缴费列表（分页）
   * 管理员查看所有，学生仅查看自己的
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      status?: number;
      type?: number;
      studentId?: string;
      userId?: string;
      role?: string;
    },
  ) {
    const { page, pageSize, sortBy = 'createdAt', sortOrder } = paginationDto;

    const where: any = { institutionId };

    if (filters?.status != null && filters?.status !== '' && !isNaN(Number(filters.status))) {
      where.status = Number(filters.status);
    }

    if (filters?.type != null && filters?.type !== '' && !isNaN(Number(filters.type))) {
      where.type = Number(filters.type);
    }

    // 管理员可以通过 studentId 筛选
    if (filters?.role === Role.ADMIN && filters?.studentId) {
      where.studentId = filters.studentId;
    }

    // 学生只能查看自己的缴费记录
    if (filters?.role === Role.STUDENT && filters?.userId) {
      where.studentId = filters.userId;
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          student: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return createPaginatedResult(payments, total, page, pageSize);
  }

  /**
   * 获取缴费详情
   */
  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            realName: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`缴费记录不存在: ${id}`);
    }

    return payment;
  }

  /**
   * 创建缴费记录
   */
  async create(institutionId: string, dto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        institutionId,
        studentId: dto.studentId,
        amount: dto.amount,
        type: dto.type,
        status: 1, // 默认待缴费
        description: dto.description || null,
        paymentMethod: dto.paymentMethod || null,
      },
      include: {
        student: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`缴费记录创建成功: 学生 ${dto.studentId}, 金额 ${dto.amount}`);

    return payment;
  }

  /**
   * 更新缴费记录
   */
  async update(id: string, dto: UpdatePaymentDto) {
    const existing = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`缴费记录不存在: ${id}`);
    }

    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
      },
      include: {
        student: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`缴费记录更新成功: ${id}`);

    return payment;
  }

  /**
   * 确认缴费（标记为已缴费）
   */
  async markAsPaid(id: string, paymentMethod?: string) {
    const existing = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`缴费记录不存在: ${id}`);
    }

    if (existing.status === 2) {
      throw new BadRequestException('该缴费记录已缴费，无需重复操作');
    }

    if (existing.status === 3) {
      throw new BadRequestException('该缴费记录已退款，无法确认缴费');
    }

    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 2, // 已缴费
        paidAt: new Date(),
        ...(paymentMethod && { paymentMethod }),
      },
      include: {
        student: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`缴费确认成功: ${id}`);

    return payment;
  }

  /**
   * 删除缴费记录
   */
  async remove(id: string) {
    const existing = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`缴费记录不存在: ${id}`);
    }

    await this.prisma.payment.delete({
      where: { id },
    });

    this.logger.log(`缴费记录已删除: ${id}`);
  }
}
