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
 * 鍙嶉鏈嶅姟
 * 澶勭悊鍙嶉 CRUD銆佸洖澶嶇瓑涓氬姟閫昏緫
 *
 * 鍙嶉鐘舵€侊細
 * - 1: 寰呭鐞? * - 2: 澶勭悊涓? * - 3: 宸插洖澶? * - 4: 宸插叧闂? */
@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 鑾峰彇鍙嶉鍒楄〃锛堝垎椤碉級
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
    if (filters?.status !== undefined && filters?.status !== null) {
      const statusNum = Number(filters.status);
      if (!isNaN(statusNum)) where.status = statusNum;
    }
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
   * 鑾峰彇鍙嶉璇︽儏
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
      throw new NotFoundException(`鍙嶉涓嶅瓨鍦? ${id}`);
    }

    return feedback;
  }

  /**
   * 鍒涘缓鍙嶉
   */
  async create(institutionId: string, parentId: string, dto: CreateFeedbackDto) {
    const feedback = await this.prisma.feedback.create({
      data: {
        institutionId,
        parentId,
        teacherId: dto.teacherId || null,
        title: dto.title || null,
        content: dto.content,
        category: dto.category || '鍏朵粬',
        attachments: dto.attachments || undefined,
        status: 1, // 榛樿寰呭鐞?      },
      include: {
        parent: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`鍙嶉鍒涘缓鎴愬姛: ${dto.title || dto.content.substring(0, 20)}`);
    return feedback;
  }

  /**
   * 鏇存柊鍙嶉淇℃伅
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
      throw new NotFoundException(`鍙嶉涓嶅瓨鍦? ${id}`);
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) {
      const statusNum = Number(data.status);
      if (!isNaN(statusNum)) updateData.status = statusNum;
    }

    const feedback = await this.prisma.feedback.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`鍙嶉鏇存柊鎴愬姛: ${id}`);
    return feedback;
  }

  /**
   * 鍒犻櫎鍙嶉
   */
  async remove(id: string) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`鍙嶉涓嶅瓨鍦? ${id}`);
    }

    await this.prisma.feedback.delete({
      where: { id },
    });

    this.logger.log(`鍙嶉宸插垹闄? ${id}`);
  }

  /**
   * 鍥炲鍙嶉
   * 鐩存帴鏇存柊鍙嶉鐨?reply 瀛楁鍜岀姸鎬?   */
  async reply(feedbackId: string, replierId: string, dto: ReplyFeedbackDto) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      throw new NotFoundException(`鍙嶉涓嶅瓨鍦? ${feedbackId}`);
    }

    // 鏇存柊鍙嶉鐨勫洖澶嶅唴瀹瑰拰鐘舵€?    const updatedFeedback = await this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        reply: dto.content,
        repliedBy: replierId,
        repliedAt: new Date(),
        status: dto.status || 3, // 榛樿宸插洖澶?      },
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

    this.logger.log(`鍙嶉 ${feedbackId} 宸插洖澶峘);
    return updatedFeedback;
  }

  /**
   * 鑾峰彇褰撳墠鐢ㄦ埛鐨勫弽棣堝垪琛?   */
  async findMyFeedbacks(userId: string, paginationDto: PaginationDto) {
    const page = Number(paginationDto?.page) || 1;
    const pageSize = Number(paginationDto?.pageSize) || 10;

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