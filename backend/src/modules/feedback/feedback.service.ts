import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';

/**
 * 反馈服务
 * 处理反馈 CRUD、回复等业务逻辑
 *
 * 反馈类型：
 * - 1: 建议
 * - 2: 投诉
 * - 3: 问题反馈
 * - 4: 其他
 *
 * 反馈状态：
 * - 1: 待处理
 * - 2: 处理中
 * - 3: 已回复
 * - 4: 已关闭
 */
@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取反馈列表（分页）
   * @param institutionId 机构 ID
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页反馈列表
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      keyword?: string;
      type?: number;
      status?: number;
      userId?: string;
    },
  ) {
    const { page, pageSize, sortBy = 'createdAt', sortOrder } = paginationDto;

    const where: any = { institutionId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status !== undefined) where.status = filters.status;
    if (filters?.userId) where.parentId = filters.userId;

    if (filters?.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { content: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [feedbacks, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          parent: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return createPaginatedResult(feedbacks, total, page, pageSize);
  }

  /**
   * 获取反馈详情
   * @param id 反馈 ID
   * @returns 反馈详细信息
   */
  async findById(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException(`反馈不存在: ${id}`);
    }

    return feedback;
  }

  /**
   * 创建反馈
   * @param institutionId 机构 ID
   * @param userId 用户 ID
   * @param dto 创建数据
   * @returns 创建的反馈信息
   */
  async create(institutionId: string, userId: string, dto: CreateFeedbackDto) {
    const feedback = await this.prisma.feedback.create({
      data: {
        institutionId,
        parentId: userId,
        title: dto.title,
        content: dto.content,
        category: dto.type ? String(dto.type) : undefined,
        attachments: dto.attachments || undefined,
        status: 1, // 默认待处理
      },
      include: {
        parent: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`反馈创建成功: ${dto.title}`);

    return feedback;
  }

  /**
   * 更新反馈信息
   * @param id 反馈 ID
   * @param data 更新数据
   * @returns 更新后的反馈信息
   */
  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      type?: number;
      status?: number;
    },
  ) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`反馈不存在: ${id}`);
    }

    const feedback = await this.prisma.feedback.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.type !== undefined && { category: String(data.type) }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    this.logger.log(`反馈更新成功: ${id}`);

    return feedback;
  }

  /**
   * 删除反馈
   * @param id 反馈 ID
   */
  async remove(id: string) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`反馈不存在: ${id}`);
    }

    await this.prisma.feedback.delete({
      where: { id },
    });

    this.logger.log(`反馈已删除: ${id}`);
  }

  /**
   * 回复反馈
   * @param feedbackId 反馈 ID
   * @param replierId 回复者 ID
   * @param dto 回复数据
   * @returns 更新后的反馈记录
   */
  async reply(feedbackId: string, replierId: string, dto: ReplyFeedbackDto) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      throw new NotFoundException(`反馈不存在: ${feedbackId}`);
    }

    // 更新反馈的回复内容和状态
    const newStatus = dto.status || 3; // 默认已回复
    const result = await this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        reply: dto.content,
        repliedBy: replierId,
        repliedAt: new Date(),
        status: newStatus,
      },
      include: {
        replier: {
          select: {
            id: true,
            realName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(`反馈 ${feedbackId} 已回复`);

    return result;
  }

  /**
   * 获取当前用户的反馈列表
   * @param userId 用户 ID
   * @param paginationDto 分页参数
   * @returns 分页反馈列表
   */
  async findMyFeedbacks(userId: string, paginationDto: PaginationDto) {
    const { page, pageSize } = paginationDto;

    const where = { parentId: userId };

    const [feedbacks, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          replier: {
            select: {
              id: true,
              realName: true,
            },
          },
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return createPaginatedResult(feedbacks, total, page, pageSize);
  }
}
