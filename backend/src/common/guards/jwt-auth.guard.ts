import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT 认证守卫（简化版）
 *
 * 只验证 token 签名和有效期，不查数据库
 * 用户信息直接从 token payload 中获取
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查是否标记为公开路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // 提取 token
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    try {
      // 验证 token（同步，不查数据库）
      const secret = this.configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key-2026');
      const payload = this.jwtService.verify(token, { secret });

      // 将 payload 中的用户信息附加到 request 对象
      request.user = {
        id: payload.sub,
        username: payload.username,
        institutionId: payload.institutionId,
        role: payload.roles?.[0] || 'STUDENT',
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      };

      return true;
    } catch (error) {
      this.logger.warn(`JWT 验证失败: ${error.message}`);
      throw new UnauthorizedException('认证令牌无效或已过期');
    }
  }

  /**
   * 从请求头提取 Bearer token
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers?.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return undefined;

    return token;
  }
}
