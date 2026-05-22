import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成唯一的 8 位邀请码
   */
  private generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * 创建邀请码
   * @param inviterId 邀请人 ID
   * @param institutionId 机构 ID
   * @param role 邀请的角色: STUDENT, PARENT, TEACHER
   */
  async create(inviterId: string, institutionId: string, role: string) {
    const code = this.generateCode();
    return this.prisma.invitation.create({
      data: {
        institutionId,
        inviterId,
        code,
        role,
      },
    });
  }

  /**
   * 获取我的邀请列表
   * @param inviterId 邀请人 ID
   */
  async getMyInvitations(inviterId: string) {
    return this.prisma.invitation.findMany({
      where: { inviterId },
      include: {
        invitee: {
          select: { id: true, username: true, realName: true, phone: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 通过邀请码获取邀请信息
   * @param code 邀请码
   */
  async getByCode(code: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { code },
      include: {
        inviter: { select: { id: true, username: true, realName: true } },
      },
    });
    if (!invitation) throw new NotFoundException('邀请码不存在');
    if (invitation.status === 1) throw new ConflictException('邀请码已使用');
    return invitation;
  }

  /**
   * 使用邀请码（注册时调用）
   * @param code 邀请码
   * @param inviteeId 被邀请人 ID
   */
  async useCode(code: string, inviteeId: string) {
    const invitation = await this.getByCode(code);
    return this.prisma.invitation.update({
      where: { code },
      data: { inviteeId, status: 1, usedAt: new Date() },
    });
  }

  /**
   * 管理员邀请统计
   * @param institutionId 机构 ID
   */
  async getStatistics(institutionId: string) {
    const total = await this.prisma.invitation.count({
      where: { institutionId },
    });
    const used = await this.prisma.invitation.count({
      where: { institutionId, status: 1 },
    });
    const byRole = await this.prisma.invitation.groupBy({
      by: ['role'],
      where: { institutionId },
      _count: true,
    });
    const byInviter = await this.prisma.invitation.groupBy({
      by: ['inviterId'],
      where: { institutionId },
      _count: true,
      orderBy: { _count: { inviterId: 'desc' } },
      take: 20,
    });

    // 获取邀请人详情
    const inviterIds = byInviter.map((i) => i.inviterId);
    const inviters = await this.prisma.user.findMany({
      where: { id: { in: inviterIds } },
      select: { id: true, username: true, realName: true },
    });
    const inviterMap = new Map(inviters.map((u) => [u.id, u]));

    return {
      total,
      used,
      unused: total - used,
      byRole: byRole.map((r) => ({ role: r.role, count: r._count })),
      topInviters: byInviter.map((i) => ({
        ...i,
        inviter: inviterMap.get(i.inviterId),
      })),
    };
  }

  /**
   * 管理员获取所有邀请列表（分页）
   * @param institutionId 机构 ID
   * @param page 页码
   * @param pageSize 每页条数
   */
  async getAll(institutionId: string, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where: { institutionId },
        include: {
          inviter: { select: { id: true, username: true, realName: true } },
          invitee: { select: { id: true, username: true, realName: true, phone: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invitation.count({ where: { institutionId } }),
    ]);
    return { items, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
  }
}
