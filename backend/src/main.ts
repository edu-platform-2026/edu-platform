import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { join } from 'path';
import * as express from 'express';

/**
 * 应用启动入口
 * 配置 Swagger 文档、CORS、全局管道、过滤器、拦截器等
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 创建 NestJS 应用实例
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // 获取配置服务
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');

  // 设置 API 前缀
  app.setGlobalPrefix(apiPrefix);

  // 配置 CORS - 允许所有来源（演示环境）
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 配置全局参数验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剥离未在 DTO 中定义的属性
      forbidNonWhitelisted: false, // 不报错，只忽略多余字段
      transform: true, // 自动将请求数据转换为 DTO 实例
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式类型转换
      },
    }),
  );

  // 配置全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 配置全局响应格式化拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 配置 Swagger 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('教育管理平台 API')
    .setDescription(
      `
      教育管理平台后端 API 文档。
      
      主要功能模块：
      - 用户认证与授权（登录、注册、JWT 令牌管理）
      - 用户管理（CRUD、角色分配、状态管理）
      - 机构管理（教育机构信息维护）
      - 班级管理（班级创建、学生管理）
      - 课程管理（课程排课、教学进度）
      - 作业管理（作业发布、提交、批改）
      - 教学资源管理（文件上传、资源共享）
      - 通知管理（系统通知、消息推送）
      - 反馈管理（家长反馈、教师回复）
      - 数据分析（学习进度、考勤统计）
    `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '请输入 JWT 令牌',
        in: 'header',
      },
      'access-token',
    )
    .addTag('auth', '认证与授权')
    .addTag('users', '用户管理')
    .addTag('institutions', '机构管理')
    .addTag('classes', '班级管理')
    .addTag('courses', '课程管理')
    .addTag('assignments', '作业管理')
    .addTag('resources', '教学资源管理')
    .addTag('notifications', '通知管理')
    .addTag('feedback', '反馈管理')
    .addTag('analytics', '数据分析')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持认证令牌
      tagsSorter: 'alpha', // 按字母排序标签
      operationsSorter: 'alpha', // 按字母排序操作
    },
    customSiteTitle: '教育管理平台 - API 文档',
  });

  // SPA 回退：所有非 API/静态文件请求返回 index.html
  const publicPath = join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  // 必须在所有 API 路由之后注册 catch-all
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/docs')) {
      return next();
    }
    res.sendFile(join(publicPath, 'index.html'));
  });

  // 启动应用
  await app.listen(port);

  logger.log(`应用已启动，监听端口: ${port}`);
  logger.log(`API 前缀: /${apiPrefix}`);
  logger.log(`Swagger 文档: http://localhost:${port}/docs`);
  logger.log(`环境: ${configService.get<string>('NODE_ENV', 'development')}`);
}

bootstrap();