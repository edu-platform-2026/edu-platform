import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * JWT 令牌载荷接口
 */
export interface JwtPayload {
  /** 用户 ID */
  sub: string;
  /** 用户名 */
  username: string;
  /** 机构 ID */
  institutionId: string;
  /** 签发时间 */
  iat?: number;
  /** 过期时间 */
  exp?: number;
}

/**
 * JWT 策略
 * 用于验证和解析 JWT 令牌
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // 从 Authorization 头部提取 Bearer 令牌
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不忽略过期令牌（由守卫处理过期逻辑）
      ignoreExpiration: false,
      // JWT 密钥
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key-2026'),
      // 签发者验证
      issuer: configService.get<string>('jwt.issuer', 'edu-management-platform'),
      // 受众验证
      audience: configService.get<string>('jwt.audience', 'edu-management-users'),
    });
  }

  /**
   * 验证 JWT 令牌载荷
   * 将验证后的用户信息附加到请求对象上
   */
  async validate(payload: JwtPayload) {
    const { sub: userId, username, institutionId } = payload;

    try {
      // 查询用户信息及其角色
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
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

      // 用户不存在或已被禁用
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      if (user.status !== 1) {
        throw new UnauthorizedException('用户账号已被禁用');
      }

      // 提取用户角色
      const roles = user.userRoles.map((ur) => ur.role.code);

      // 提取用户权限（去重）
      const permissions = [
        ...new Set(
          user.userRoles.flatMap((ur) =>
            ur.role.rolePermissions.map((rp) => rp.permission.code),
          ),
        ),
      ];

      // 返回附加到 request.user 的对象
      return {
        id: user.id,
        username: user.username,
        realName: user.realName,
        institutionId: user.institutionId,
        roles,
        permissions,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`JWT 验证失败: ${error.message}`);
      throw new UnauthorizedException('认证失败，请重新登录');
    }
  }
}
