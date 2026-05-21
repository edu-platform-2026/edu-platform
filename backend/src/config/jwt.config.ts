import { registerAs } from '@nestjs/config';

/**
 * JWT 认证配置
 * 包含令牌密钥、过期时间等设置
 */
export const jwtConfig = registerAs('jwt', () => ({
  /** JWT 签名密钥 */
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-2026',

  /** 访问令牌过期时间（默认 2 小时） */
  expiresIn: process.env.JWT_EXPIRATION || '2h',

  /** 刷新令牌过期时间（默认 7 天） */
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',

  /** 令牌签发者 */
  issuer: 'edu-management-platform',

  /** 令牌受众 */
  audience: 'edu-management-users',
}));
