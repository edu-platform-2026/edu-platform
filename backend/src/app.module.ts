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
import { InvitationsModule } from './modules/invitations/invitations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ParentModule } from './modules/parent/parent.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
/**
 * Application root module
 */
@Module({
  imports: [
    // Static file serving - frontend build output
    ServeStaticModule.forRoot({
      rootPath: '/opt/edu-platform/frontend/dist',
      exclude: ['/api/(.*)', '/docs', '/docs/(.*)'],
    }),
    // Global config module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, jwtConfig],
      cache: true,
    }),
    // Scheduled tasks module
    ScheduleModule.forRoot(),
    // Database module
    PrismaModule,
    // Business modules
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
    InvitationsModule,
    MessagesModule,
    OperationLogsModule,
    PaymentsModule,
    ParentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}