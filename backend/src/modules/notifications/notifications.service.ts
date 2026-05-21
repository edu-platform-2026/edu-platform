import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

/**
 * 通知服务
 * 处理通知 CRUD、标记已读、推送等业务逻辑
 *
 * 通知类型：
 * - 1: 系统通知
 * - 2: 作业通知
 * - 3: 课程通知
 * - 4: 考勤通知
 * - 5: 一般通知
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取通知列表（分页）
   * @param institutionId 机构 ID
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页通知列表
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      keyword?: string;
      type?: number;
      isUrgent?: boolean;
      targetRole?: string;
    },
  ) {
    const { page, pageSize, sortBy = 'createdAt', sortOrder } = paginationDto;

    const where: any = { institutionId };

    if (filters?.type) where.type = filters.type;
    if (filters?.isUrgent !== undefined) where.isUrgent = filters.isUrgent;
    if (filters?.targetRole) where.targetRole = filters.targetRole;

    if (filters?.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { content: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          sender: {
            select: {
              id: true,
              realName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { notificationReads: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const formattedNotifications = notifications.map((n) => ({
      ...n,
      readCount: n._count.notificationReads,
      _count: undefined,
    }));

    return createPaginatedResult(formattedNotifications, total, page, pageSize);
  }

  /**
   * 获取通知详情
   * @param id 通知 ID
   * @returns 通知详细信息
   */
  async findById(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            realName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { notificationReads: true },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException(`通知不存在: ${id}`);
    }

    return {
      ...notification,
      readCount: notification._count.notificationReads,
      _count: undefined,
    };
  }

  /**
   * 创建通知
   * @param institutionId 机构 ID
   * @param senderId 发送者 ID
   * @param dto 创建数据
   * @returns 创建的通知信息
   */
  async create(institutionId: string, senderId: string, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        institutionId,
        senderId,
        title: dto.title,
        content: dto.content,
        type: dto.type,
        targetRole: dto.targetRole,
        targetUsers: dto.targetUsers || undefined,
        attachments: dto.attachments || undefined,
        isUrgent: dto.isUrgent || false,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`通知创建成功: ${dto.title}`);

    return notification;
  }

  /**
   * 更新通知信息
   * @param id 通知 ID
   * @param data 更新数据
   * @returns 更新后的通知信息
   */
  async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      type?: number;
      targetRole?: string;
      targetUsers?: string[];
      isUrgent?: boolean;
    },
  ) {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`通知不存在: ${id}`);
    }

    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.targetRole !== undefined && { targetRole: data.targetRole }),
        ...(data.targetUsers !== undefined && { targetUsers: data.targetUsers }),
        ...(data.isUrgent !== undefined && { isUrgent: data.isUrgent }),
      },
    });

    this.logger.log(`通知更新成功: ${id}`);

    return notification;
  }

  /**
   * 删除通知
   * @param id 通知 ID
   */
  async remove(id: string) {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`通知不存在: ${id}`);
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    this.logger.log(`通知已删除: ${id}`);
  }

  /**
   * 获取用户的通知列表（包含已读状态）
   * @param userId 用户 ID
   * @param institutionId 机构 ID
   * @param paginationDto 分页参数
   * @returns 分页通知列表（含已读状态）
   */
  async findForUser(
    userId: string,
    institutionId: string,
    paginationDto: PaginationDto,
  ) {
    const { page, pageSize } = paginationDto;

    // 查询所有已发布的通知
    const where: any = {
      institutionId,
      publishedAt: { not: null },
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              realName: true,
            },
          },
          notificationReads: {
            where: { userId },
            select: { readAt: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const formattedNotifications = notifications.map((n) => ({
      ...n,
      isRead: n.notificationReads.length > 0,
      readAt: n.notificationReads[0]?.readAt || null,
      notificationReads: undefined,
    }));

    return createPaginatedResult(formattedNotifications, total, page, pageSize);
  }

  /**
   * 标记通知为已读
   * @param notificationId 通知 ID
   * @param userId 用户 ID
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`通知不存在: ${notificationId}`);
    }

    // 如果已读则忽略
    const existingRead = await this.prisma.notificationRead.findUnique({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
    });

    if (existingRead) {
      return { message: '通知已标记为已读' };
    }

    await this.prisma.notificationRead.create({
      data: {
        notificationId,
        userId,
      },
    });

    this.logger.log(`通知 ${notificationId} 已被用户 ${userId} 标记为已读`);

    return { message: '通知已标记为已读' };
  }

  /**
   * 批量标记通知为已读
   * @param notificationIds 通知 ID 列表
   * @param userId 用户 ID
   */
  async markMultipleAsRead(notificationIds: string[], userId: string) {
    const results = await Promise.all(
      notificationIds.map((id) => this.markAsRead(id, userId)),
    );

    return { message: `已标记 ${results.length} 条通知为已读` };
  }

  /**
   * 获取未读通知数量
   * @param userId 用户 ID
   * @param institutionId 机构 ID
   * @returns 未读通知数量
   */
  async getUnreadCount(userId: string, institutionId: string) {
    // 获取所有已发布通知的 ID
    const allNotifications = await this.prisma.notification.findMany({
      where: {
        institutionId,
        publishedAt: { not: null },
      },
      select: { id: true },
    });

    // 获取已读通知的 ID
    const readNotifications = await this.prisma.notificationRead.findMany({
      where: {
        userId,
        notificationId: {
          in: allNotifications.map((n) => n.id),
        },
      },
      select: { notificationId: true },
    });

    const readIds = new Set(readNotifications.map((r) => r.notificationId));
    const unreadCount = allNotifications.filter((n) => !readIds.has(n.id)).length;

    return { unreadCount };
  }
}
