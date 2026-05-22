import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key-2026'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '2h'),
        },
      }),
    }),
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService, PrismaService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
