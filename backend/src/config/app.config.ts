import { registerAs } from '@nestjs/config';

/**
 * 应用基础配置
 * 从环境变量中读取应用相关配置
 */
export const appConfig = registerAs('app', () => ({
  /** 应用运行环境 */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** 服务监听端口 */
  port: parseInt(process.env.PORT || '3000', 10) || 3000,

  /** API 路由前缀 */
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  /** CORS 允许的来源地址（多个用逗号分隔） */
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  /** 接口限流 - 时间窗口（秒） */
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10) || 60,

  /** 接口限流 - 时间窗口内最大请求数 */
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '10', 10) || 10,
}));
