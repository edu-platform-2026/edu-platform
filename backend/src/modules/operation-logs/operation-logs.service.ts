import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';

/**
 * 操作日志服务
 * 处理操作日志查询等业务逻辑
 */
@Injectable()
export class OperationLogsService {
  private readonly logger = new Logger(OperationLogsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取操作日志列表（分页）
   * 支持按模块、操作类型、用户、时间范围筛选
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      module?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { page, pageSize, sortBy = 'createdAt', sortOrder } = paginationDto;

    const where: any = { institutionId };

    if (filters?.module) {
      where.module = filters.module;
    }

    if (filters?.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters?.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [logs, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return createPaginatedResult(logs, total, page, pageSize);
  }

  /**
   * 获取操作日志详情
   */
  async findById(id: string) {
    const log = await this.prisma.operationLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
            phone: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`操作日志不存在: ${id}`);
    }

    return log;
  }
}
