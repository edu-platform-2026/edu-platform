import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

/**
 * 机构服务
 * 处理机构信息的查询、更新、Logo 上传等业务逻辑
 */
@Injectable()
export class InstitutionsService {
  private readonly logger = new Logger(InstitutionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取当前机构信息
   * @param institutionId 机构 ID
   * @returns 机构详细信息
   */
  async getCurrentInstitution(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
            courses: true,
          },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('机构不存在');
    }

    return {
      ...institution,
      statistics: {
        userCount: institution._count.users,
        classCount: institution._count.classes,
        courseCount: institution._count.courses,
      },
      _count: undefined,
    };
  }

  /**
   * 获取公开的机构信息（无需登录）
   * @param institutionId 机构 ID
   * @returns 机构公开信息
   */
  async getPublicInstitution(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId, status: 1 },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        description: true,
        slogan: true,
        address: true,
        phone: true,
        email: true,
        wechat: true,
        website: true,
        businessHours: true,
      },
    });

    if (!institution) {
      throw new NotFoundException('机构不存在或已停用');
    }

    return institution;
  }

  /**
   * 更新当前机构信息
   * @param institutionId 机构 ID
   * @param dto 更新数据
   * @returns 更新后的机构信息
   */
  async updateCurrentInstitution(
    institutionId: string,
    dto: UpdateInstitutionDto,
  ) {
    // 检查机构是否存在
    const existing = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!existing) {
      throw new NotFoundException('机构不存在');
    }

    const institution = await this.prisma.institution.update({
      where: { id: institutionId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.slogan !== undefined && { slogan: dto.slogan }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.wechat !== undefined && { wechat: dto.wechat }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.businessHours !== undefined && { businessHours: dto.businessHours }),
      },
    });

    this.logger.log(`机构信息更新成功: ${institutionId}`);

    return institution;
  }

  /**
   * 上传机构 Logo
   * @param institutionId 机构 ID
   * @param logoUrl Logo 图片 URL
   * @returns 更新后的机构信息
   */
  async uploadLogo(institutionId: string, logoUrl: string) {
    const existing = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!existing) {
      throw new NotFoundException('机构不存在');
    }

    const institution = await this.prisma.institution.update({
      where: { id: institutionId },
      data: { logoUrl },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    this.logger.log(`机构 Logo 更新成功: ${institutionId}`);

    return institution;
  }
}
