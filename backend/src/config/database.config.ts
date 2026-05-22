import { registerAs } from '@nestjs/config';

/**
 * 数据库配置
 * 包含 PostgreSQL 和 Redis 连接信息
 */
export const databaseConfig = registerAs('database', () => ({
  /** PostgreSQL 连接地址 */
  url: process.env.DATABASE_URL,

  /** Redis 连接地址 */
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  /** MinIO 对象存储配置 */
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    bucket: process.env.MINIO_BUCKET || 'edu-platform',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
}));
