import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { CreateResourceDto } from './dto/create-resource.dto';

/**
 * 教学资源服务
 * 处理资源上传、下载、搜索、分类等业务逻辑
 */
@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取资源列表（分页）
   * @param institutionId 机构 ID
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页资源列表
   */
  async findAll(
    institutionId: string,
    paginationDto: PaginationDto,
    filters?: {
      keyword?: string;
      category?: string;
      subject?: string;
      uploaderId?: string;
      isPublic?: boolean;
    },
  ) {
    const { page, pageSize, sortBy = 'createdAt', sortOrder } = paginationDto;

    const where: any = { institutionId };

    if (filters?.category) where.category = filters.category;
    if (filters?.subject) where.subject = filters.subject;
    if (filters?.uploaderId) where.uploaderId = filters.uploaderId;
    if (filters?.isPublic !== undefined) where.isPublic = filters.isPublic;

    if (filters?.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { description: { contains: filters.keyword, mode: 'insensitive' } },
        { category: { contains: filters.keyword, mode: 'insensitive' } },
        { subject: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          uploader: {
            select: {
              id: true,
              realName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.resource.count({ where }),
    ]);

    return createPaginatedResult(resources, total, page, pageSize);
  }

  /**
   * 获取资源详情
   * @param id 资源 ID
   * @returns 资源详细信息
   */
  async findById(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            realName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException(`资源不存在: ${id}`);
    }

    return resource;
  }

  /**
   * 上传/创建资源
   * @param institutionId 机构 ID
   * @param uploaderId 上传者 ID
   * @param dto 创建数据
   * @returns 创建的资源信息
   */
  async create(institutionId: string, uploaderId: string, dto: CreateResourceDto) {
    const resource = await this.prisma.resource.create({
      data: {
        institutionId,
        uploaderId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        subject: dto.subject,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize || null,
        fileType: dto.fileType,
        thumbnailUrl: dto.thumbnailUrl,
        isPublic: dto.isPublic || false,
        tags: dto.tags || undefined,
        downloadCount: 0,
      },
      include: {
        uploader: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
    });

    this.logger.log(`资源上传成功: ${dto.title}`);

    return resource;
  }

  /**
   * 更新资源信息
   * @param id 资源 ID
   * @param data 更新数据
   * @returns 更新后的资源信息
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      subject?: string;
      isPublic?: boolean;
      tags?: string[];
      thumbnailUrl?: string;
    },
  ) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`资源不存在: ${id}`);
    }

    const resource = await this.prisma.resource.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
      },
    });

    this.logger.log(`资源更新成功: ${id}`);

    return resource;
  }

  /**
   * 删除资源
   * @param id 资源 ID
   */
  async remove(id: string) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`资源不存在: ${id}`);
    }

    await this.prisma.resource.delete({
      where: { id },
    });

    this.logger.log(`资源已删除: ${id}`);
  }

  /**
   * 记录下载次数
   * @param id 资源 ID
   * @returns 更新后的下载次数
   */
  async recordDownload(id: string) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`资源不存在: ${id}`);
    }

    const resource = await this.prisma.resource.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        fileType: true,
        downloadCount: true,
      },
    });

    return resource;
  }

  /**
   * 搜索资源
   * @param institutionId 机构 ID
   * @param keyword 关键词
   * @param limit 返回数量限制
   * @returns 匹配的资源列表
   */
  async search(institutionId: string, keyword: string, limit = 20) {
    return this.prisma.resource.findMany({
      where: {
        institutionId,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { category: { contains: keyword, mode: 'insensitive' } },
          { subject: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        subject: true,
        fileType: true,
        fileSize: true,
        thumbnailUrl: true,
        downloadCount: true,
        createdAt: true,
      },
    });
  }

  /**
   * 获取资源分类列表
   * @param institutionId 机构 ID
   * @returns 分类列表
   */
  async getCategories(institutionId: string) {
    const result = await this.prisma.resource.findMany({
      where: { institutionId },
      select: { category: true },
      distinct: ['category'],
    });

    return result
      .map((r) => r.category)
      .filter((c) => c !== null && c !== undefined);
  }
}
