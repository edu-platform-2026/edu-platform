import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';

import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';

import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { ClassesModule } from './modules/classes/classes.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MessagesModule } from './modules/messages/messages.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvitationsModule } from './modules/invitations/invitations.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

/**
 * 应用根模块
 * 负责导入所有子模块并配置全局守卫
 */
@Module({
  imports: [
    // 全局配置模块 - 加载环境变量和配置文件
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用，无需在每个模块中重复导入
      envFilePath: '.env',
      load: [appConfig, databaseConfig, jwtConfig],
      cache: true, // 缓存配置，提高性能
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 前端静态文件托管
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)', '/docs/(.*)'],
    }),

    // 数据库模块
    PrismaModule,

    // 业务模块
    AuthModule,
    UsersModule,
    InstitutionsModule,
    ClassesModule,
    AssignmentsModule,
    CoursesModule,
    ResourcesModule,
    NotificationsModule,
    FeedbackModule,
    AnalyticsModule,
    MessagesModule,
    OperationLogsModule,
    PaymentsModule,
    InvitationsModule,
  ],
  providers: [
    // 全局 JWT 认证守卫 - 所有路由默认需要认证
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
