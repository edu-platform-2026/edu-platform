import { Module } from '@nestjs/common';
import { OperationLogsController } from './operation-logs.controller';
import { OperationLogsService } from './operation-logs.service';

/**
 * 操作日志模块
 * 处理系统操作日志的查询等功能
 */
@Module({
  controllers: [OperationLogsController],
  providers: [OperationLogsService],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
