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
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      keyword?: string;
      category?: string;
      status?: number;
      parentId?: string;
    },
  ) {
    const page = Number(paginationDto?.page) || 1;
    const pageSize = Number(paginationDto?.pageSize) || 10;
    const sortBy = paginationDto?.sortBy || 'createdAt';
    const sortOrder = paginationDto?.sortOrder || 'desc';

    const where: any = { institutionId };

    if (filters?.category) where.category = filters.category;
    if (filters?.status !== undefined && filters?.status !== null) where.status = Number(filters.status);
    if (filters?.parentId) where.parentId = filters.parentId;

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
          replier: {
            select: {
              id: true,
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
        teacher: {
          select: {
            id: true,
            realName: true,
          },
        },
        replier: {
          select: {
            id: true,
            realName: true,
            avatarUrl: true,
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
   */
  async create(institutionId: string, parentId: string, dto: CreateFeedbackDto) {
    const feedback = await this.prisma.feedback.create({
      data: {
        institutionId,
        parentId,
        teacherId: dto.teacherId || null,
        title: dto.title,
        content: dto.content,
        category: dto.category || '其他',
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
   */
  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      category?: string;
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
        ...(data.category !== undefined && { category: data.category }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    this.logger.log(`反馈更新成功: ${id}`);

    return feedback;
  }

  /**
   * 删除反馈
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
   * 直接更新反馈的 reply 字段和状态
   */
  async reply(feedbackId: string, replierId: string, dto: ReplyFeedbackDto) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      throw new NotFoundException(`反馈不存在: ${feedbackId}`);
    }

    // 更新反馈的回复内容和状态
    const updatedFeedback = await this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        reply: dto.content,
        repliedBy: replierId,
        repliedAt: new Date(),
        status: dto.status || 3, // 默认已回复
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

    return updatedFeedback;
  }

  /**
   * 获取当前用户的反馈列表
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
