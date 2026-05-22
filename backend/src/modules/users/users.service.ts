import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';

/**
 * 用户服务
 * 处理用户相关的业务逻辑，包括 CRUD、角色分配、状态管理等
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly saltRounds = 10;

  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户列表（分页）
   * @param paginationDto 分页参数
   * @param filters 筛选条件
   * @returns 分页用户列表
   */
  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      institutionId?: string;
      keyword?: string;
      status?: number;
      role?: string;
    },
  ) {
    const page = Number(paginationDto?.page) || 1;
    const pageSize = Number(paginationDto?.pageSize) || 10;
    const sortBy = paginationDto?.sortBy || 'createdAt';
    const sortOrder = paginationDto?.sortOrder || 'desc';

    // 构建查询条件
    const where: any = {};

    if (filters?.institutionId) {
      where.institutionId = filters.institutionId;
    }

    if (filters?.status !== undefined && filters?.status !== null) {
      const statusNum = Number(filters.status);
      if (!isNaN(statusNum)) {
        where.status = statusNum;
      }
    }

    if (filters?.keyword) {
      where.OR = [
        { username: { contains: filters.keyword, mode: 'insensitive' } },
        { realName: { contains: filters.keyword, mode: 'insensitive' } },
        { phone: { contains: filters.keyword } },
        { email: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    if (filters?.role) {
      where.userRoles = {
        some: {
          role: {
            code: filters.role,
          },
        },
      };
    }

    // 排序配置
    const orderBy: any = { [sortBy]: sortOrder };

    // 并行查询数据和总数
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          username: true,
          realName: true,
          phone: true,
          email: true,
          avatarUrl: true,
          gender: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
          userRoles: {
            select: {
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 格式化用户数据
    const formattedUsers = users.map((user) => ({
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
      userRoles: undefined,
    }));

    return createPaginatedResult(formattedUsers, total, page, pageSize);
  }

  /**
   * 根据 ID 获取用户详情
   * @param id 用户 ID
   * @returns 用户详细信息
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`用户不存在: ${id}`);
    }

    // 提取角色和权限
    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      code: ur.role.code,
      name: ur.role.name,
    }));

    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    // 排除密码和冗余数据
    const { passwordHash, userRoles, ...userInfo } = user;

    return {
      ...userInfo,
      roles,
      permissions,
    };
  }

  /**
   * 根据用户名查找用户
   * @param username 用户名
   * @returns 用户信息或 null
   */
  async findByUsername(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * 根据手机号查找用户
   * @param phone 手机号
   * @returns 用户信息或 null
   */
  async findByPhone(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * 创建用户
   * @param data 用户数据
   * @returns 创建的用户信息
   */
  async create(data: {
    username: string;
    password: string;
    realName: string;
    phone?: string;
    email?: string;
    gender?: number;
    institutionId: string;
    role?: Role;
  }) {
    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findFirst({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查手机号是否已存在
    if (data.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });

      if (existingPhone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(data.password, this.saltRounds);

    // 使用事务创建用户和角色关联
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: data.username,
          passwordHash,
          realName: data.realName,
          phone: data.phone,
          email: data.email,
          gender: data.gender || 0,
          institutionId: data.institutionId,
          status: 1,
        },
      });

      // 分配角色
      if (data.role) {
        const roleRecord = await tx.role.findFirst({
          where: {
            code: data.role,
            OR: [
              { institutionId: data.institutionId },
              { isSystem: true },
            ],
          },
        });

        if (roleRecord) {
          await tx.userRole.create({
            data: {
              userId: newUser.id,
              roleId: roleRecord.id,
            },
          });
        }
      }

      return newUser;
    });

    this.logger.log(`用户创建成功: ${data.username}`);

    const { passwordHash: _, ...result } = user;
    return result;
  }

  /**
   * 更新用户信息
   * @param id 用户 ID
   * @param data 更新数据
   * @returns 更新后的用户信息
   */
  async update(
    id: string,
    data: {
      realName?: string;
      phone?: string;
      email?: string;
      avatarUrl?: string;
      gender?: number;
    },
  ) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`用户不存在: ${id}`);
    }

    // 检查手机号是否被其他用户使用
    if (data.phone && data.phone !== existingUser.phone) {
      const phoneUsed = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });

      if (phoneUsed) {
        throw new ConflictException('手机号已被其他用户使用');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        email: true,
        avatarUrl: true,
        gender: true,
        status: true,
        updatedAt: true,
      },
    });

    this.logger.log(`用户更新成功: ${id}`);

    return user;
  }

  /**
   * 删除用户（软删除 - 禁用状态）
   * @param id 用户 ID
   */
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`用户不存在: ${id}`);
    }

    // 软删除：将状态设为禁用
    await this.prisma.user.update({
      where: { id },
      data: { status: 0 },
    });

    this.logger.log(`用户已禁用: ${id}`);
  }

  /**
   * 为用户分配角色
   * @param userId 用户 ID
   * @param roleId 角色 ID
   * @param institutionId 机构 ID
   */
  async assignRole(userId: string, roleId: string, institutionId: string) {
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`用户不存在: ${userId}`);
    }

    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`角色不存在: ${roleId}`);
    }

    // 检查是否已分配该角色
    const existingAssignment = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException('用户已拥有该角色');
    }

    // 分配角色
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });

    this.logger.log(`角色分配成功: 用户 ${userId} -> 角色 ${roleId}`);

    return { message: '角色分配成功' };
  }

  /**
   * 移除用户角色
   * @param userId 用户 ID
   * @param roleId 角色 ID
   */
  async removeRole(userId: string, roleId: string) {
    const existingAssignment = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!existingAssignment) {
      throw new NotFoundException('用户未拥有该角色');
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    this.logger.log(`角色移除成功: 用户 ${userId} -> 角色 ${roleId}`);

    return { message: '角色移除成功' };
  }

  /**
   * 修改用户状态
   * @param id 用户 ID
   * @param status 目标状态（0-禁用, 1-启用）
   */
  async changeStatus(id: string, status: number) {
    if (status !== 0 && status !== 1) {
      throw new BadRequestException('状态值必须是 0（禁用）或 1（启用）');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`用户不存在: ${id}`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    const statusText = status === 1 ? '启用' : '禁用';
    this.logger.log(`用户状态已${statusText}: ${id}`);

    return { message: `用户已${statusText}` };
  }

  /**
   * 重置用户密码
   * @param id 用户 ID
   * @param newPassword 新密码
   */
  async resetPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`用户不存在: ${id}`);
    }

    const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    this.logger.log(`用户密码重置成功: ${id}`);

    return { message: '密码重置成功' };
  }
}
