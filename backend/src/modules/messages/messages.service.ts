import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Role } from '../../common/enums/role.enum';

/**
 * 站内消息服务
 * 处理消息发送、接收、已读标记等业务逻辑
 *
 * 消息类型：
 * - 1: 系统消息
 * - 2: 通知消息
 * - 3: 个人消息
 */
@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取消息列表（分页）
   * 管理员可查看所有消息，其他角色仅可查看与自己相关的消息
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      type?: number;
      userId?: string;
      role?: string;
    },
  ) {
    const { page, pageSize, sortBy = 'createdAt', sortOrder } = paginationDto;

    const where: any = { institutionId };

    if (filters?.type != null && !isNaN(Number(filters.type))) {
      where.type = Number(filters.type);
    }

    // 非管理员只能看到自己发送或接收的消息
    if (filters?.role !== Role.ADMIN && filters?.userId) {
      where.OR = [
        { senderId: filters.userId },
        { receiverId: filters.userId },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return createPaginatedResult(messages, total, page, pageSize);
  }

  /**
   * 获取当前用户的消息列表（发送 + 接收）
   */
  async findMyMessages(userId: string, paginationDto: PaginationDto) {
    const { page, pageSize } = paginationDto;

    const where = {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return createPaginatedResult(messages, total, page, pageSize);
  }

  /**
   * 获取消息详情
   */
  async findById(id: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`消息不存在: ${id}`);
    }

    return message;
  }

  /**
   * 发送消息
   */
  async create(institutionId: string, senderId: string, dto: CreateMessageDto) {
    // 验证接收者是否存在
    const receiver = await this.prisma.user.findUnique({ where: { id: dto.receiverId } });
    if (!receiver) {
      throw new NotFoundException('接收者不存在');
    }

    const message = await this.prisma.message.create({
      data: {
        institutionId,
        senderId,
        receiverId: dto.receiverId,
        content: dto.content,
        type: dto.type || 1,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            realName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`消息发送成功: ${senderId} -> ${dto.receiverId}`);

    return message;
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`消息不存在: ${id}`);
    }

    // 只有接收者才能标记消息为已读
    if (message.receiverId !== userId) {
      throw new ForbiddenException('只有接收者才能标记消息为已读');
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    this.logger.log(`消息已标记为已读: ${id}`);

    return updatedMessage;
  }

  /**
   * 删除消息
   */
  async remove(id: string) {
    const existing = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`消息不存在: ${id}`);
    }

    await this.prisma.message.delete({
      where: { id },
    });

    this.logger.log(`消息已删除: ${id}`);
  }
}
