import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

/**
 * 认证模块
 * 处理用户认证、JWT 令牌管理等
 */
@Module({
  imports: [
    // Passport 模块配置
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // JWT 模块配置 - 异步加载配置
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key-2026'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '2h'),
          issuer: configService.get<string>('jwt.issuer', 'edu-management-platform'),
          audience: configService.get<string>('jwt.audience', 'edu-management-users'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
