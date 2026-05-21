import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 数据库服务
 * 扩展 PrismaClient，实现模块生命周期管理
 * 在应用启动时连接数据库，关闭时断开连接
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  /**
   * 模块初始化时连接数据库
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('数据库连接成功');
    } catch (error) {
      this.logger.error('数据库连接失败', error);
      throw error;
    }
  }

  /**
   * 模块销毁时断开数据库连接
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('数据库连接已断开');
  }

  /**
   * 清空所有表数据（仅用于测试环境）
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('清空数据库操作仅允许在测试环境执行');
    }

    // 按照外键依赖的反序删除数据
    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');

    for (const modelKey of models) {
      const model = this[modelKey as string];
      if (model && typeof model.deleteMany === 'function') {
        await model.deleteMany();
      }
    }
  }
}
