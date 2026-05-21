import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma 数据库模块
 * 使用 @Global() 装饰器设为全局模块
 * 导出 PrismaService 供其他模块注入使用
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
