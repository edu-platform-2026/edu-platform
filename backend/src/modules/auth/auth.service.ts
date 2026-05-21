import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

/**
 * JWT 令牌载荷接口
 */
interface TokenPayload {
  sub: string;
  username: string;
  institutionId: string;
}

/**
 * 认证服务
 * 处理登录、注册、令牌刷新等认证相关业务逻辑
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 验证用户凭据
   * @param username 用户名
   * @param password 密码
   * @returns 验证通过的用户信息（不含密码），失败返回 null
   */
  async validateUser(username: string, password: string): Promise<any> {
    // 根据用户名查找用户
    const user = await this.prisma.user.findFirst({
      where: {
        username,
        status: 1, // 只查找启用状态的用户
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.warn(`用户不存在或已禁用: ${username}`);
      return null;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(`密码验证失败: ${username}`);
      return null;
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 返回用户信息（排除密码）
    const { passwordHash, ...result } = user;
    return {
      ...result,
      roles: user.userRoles.map((ur) => ur.role.code),
    };
  }

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   * @returns 包含令牌和用户信息的登录响应
   */
  async login(username: string, password: string) {
    // 验证用户凭据
    const user = await this.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成令牌
    const tokens = await this.generateTokens({
      sub: user.id,
      username: user.username,
      institutionId: user.institutionId,
    });

    this.logger.log(`用户登录成功: ${username}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        roles: user.roles,
        institutionId: user.institutionId,
      },
    };
  }

  /**
   * 用户注册
   * @param registerDto 注册信息
   * @returns 创建的用户信息
   */
  async register(registerDto: RegisterDto) {
    const { username, password, realName, phone, email, gender, institutionId, role } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    // 检查机构是否存在
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new ConflictException('机构不存在');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    // 创建用户（事务操作）
    const user = await this.prisma.$transaction(async (tx) => {
      // 创建用户记录
      const newUser = await tx.user.create({
        data: {
          username,
          passwordHash,
          realName,
          phone,
          email,
          gender: gender || 0,
          institutionId,
          status: 1,
        },
      });

      // 如果指定了角色，分配角色
      if (role) {
        const roleRecord = await tx.role.findFirst({
          where: {
            code: role,
            OR: [
              { institutionId },
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

    this.logger.log(`用户注册成功: ${username}`);

    // 返回用户信息（排除密码）
    const { passwordHash: _, ...result } = user;
    return result;
  }

  /**
   * 刷新令牌
   * @param refreshToken 刷新令牌
   * @returns 新的令牌对
   */
  async refreshToken(refreshToken: string) {
    try {
      // 验证刷新令牌
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 检查用户是否存在且启用
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 1) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      // 生成新的令牌对
      const tokens = await this.generateTokens({
        sub: user.id,
        username: user.username,
        institutionId: user.institutionId,
      });

      this.logger.log(`令牌刷新成功: ${user.username}`);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`令牌刷新失败: ${error.message}`);
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 获取用户个人信息
   * @param userId 用户 ID
   * @returns 用户详细信息
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      throw new UnauthorizedException('用户不存在');
    }

    // 提取角色和权限
    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    // 返回用户信息（排除密码）
    const { passwordHash, userRoles, ...userInfo } = user;

    return {
      ...userInfo,
      roles,
      permissions,
    };
  }

  /**
   * 修改密码
   * @param userId 用户 ID
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('当前密码不正确');
    }

    // 加密新密码并更新
    const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    this.logger.log(`用户修改密码成功: ${user.username}`);

    return { message: '密码修改成功' };
  }

  /**
   * 生成访问令牌和刷新令牌
   * @param payload 令牌载荷
   * @returns 令牌对
   */
  private async generateTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      // 生成访问令牌
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '2h'),
      }),
      // 生成刷新令牌
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 7200, // 2 小时（秒）
    };
  }
}
