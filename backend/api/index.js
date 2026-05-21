const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

// Import from compiled dist/
const { AppModule } = require('../dist/app.module');
const { HttpExceptionFilter } = require('../dist/common/filters/http-exception.filter');
const { TransformInterceptor } = require('../dist/common/interceptors/transform.interceptor');

const server = express();
let app = null;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn'],
    });

    app.setGlobalPrefix('api/v1');
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  }
  return server;
}

module.exports = async function handler(req, res) {
  const srv = await bootstrap();
  return srv(req, res);
};