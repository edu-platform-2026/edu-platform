import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * 本地认证策略
 * 使用用户名和密码进行认证
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  /**
   * 验证用户凭据
   * @param username 用户名
   * @param password 密码
   * @returns 验证通过的用户信息
   */
  async validate(username: string, password: string): Promise<any> {
    this.logger.debug(`本地策略验证用户: ${username}`);

    const user = await this.authService.validateUser(username, password);

    if (!user) {
      this.logger.warn(`用户认证失败: ${username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    return user;
  }
}
