import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

interface TokenPayload {
  sub: string;
  username: string;
  institutionId: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { username, status: 1 },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return null;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash, ...result } = user;
    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp: any) => rp.permission.code),
        ),
      ),
    ];

    return { ...result, roles, permissions };
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      username: user.username,
      institutionId: user.institutionId,
      roles: user.roles,
      permissions: user.permissions,
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: tokens.tokenType,
      expires_in: tokens.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        name: user.realName,
        realName: user.realName,
        role: user.roles[0] || 'STUDENT',
        roles: user.roles,
        institutionId: user.institutionId,
        email: user.email,
        phone: user.phone,
        avatar: user.avatarUrl,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, password, realName, phone, email, gender, institutionId, role, invitationCode } = registerDto;

    // Check username uniqueness
    const existingUser = await this.prisma.user.findFirst({ where: { username } });
    if (existingUser) throw new ConflictException('Username already exists');

    // Check phone uniqueness
    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhone) throw new ConflictException('Phone already registered');
    }

    // Handle invitation code
    let finalInstitutionId = institutionId;
    let finalRole = role;
    let invitationRecord: any = null;

    if (invitationCode) {
      invitationRecord = await this.prisma.invitation.findUnique({
        where: { code: invitationCode },
      });
      if (!invitationRecord) {
        throw new ConflictException('Invalid invitation code');
      }
      if (invitationRecord.status === 1) {
        throw new ConflictException('Invitation code already used');
      }
      // Use invitation's institution and role
      if (!finalInstitutionId) finalInstitutionId = invitationRecord.institutionId;
      if (!finalRole) finalRole = invitationRecord.role as any;
    }

    // Find default institution if not specified
    if (!finalInstitutionId) {
      const defaultInstitution = await this.prisma.institution.findFirst({
        where: { status: 1 },
        orderBy: { createdAt: 'asc' },
      });
      if (defaultInstitution) finalInstitutionId = defaultInstitution.id;
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: finalInstitutionId },
    });
    if (!institution) throw new ConflictException('Institution not found');

    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    // Create user in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          passwordHash,
          realName,
          phone,
          email,
          gender: gender || 0,
          institutionId: finalInstitutionId!,
          status: 1,
        },
      });

      // Assign role
      if (finalRole) {
        const roleRecord = await tx.role.findFirst({
          where: {
            code: finalRole,
            OR: [
              { institutionId: finalInstitutionId! },
              { isSystem: true },
            ],
          },
        });
        if (roleRecord) {
          await tx.userRole.create({
            data: { userId: newUser.id, roleId: roleRecord.id },
          });
        }
      }

      // Mark invitation as used
      if (invitationRecord) {
        await tx.invitation.update({
          where: { code: invitationCode },
          data: { inviteeId: newUser.id, status: 1, usedAt: new Date() },
        });
      }

      return newUser;
    });

    this.logger.log(`User registered: ${username}${invitationCode ? ' (with invite code)' : ''}`);

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== 1) {
        throw new UnauthorizedException('User not found or disabled');
      }

      const tokens = await this.generateTokens({
        sub: user.id,
        username: user.username,
        institutionId: user.institutionId,
        roles: payload.roles,
        permissions: payload.permissions,
      });

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        institution: { select: { id: true, name: true, logoUrl: true } },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    const { passwordHash, userRoles, ...userInfo } = user;
    return {
      ...userInfo,
      name: user.realName,
      role: roles[0] || 'STUDENT',
      roles,
      avatar: user.avatarUrl,
      permissions,
    };
  }

  async updateProfile(userId: string, updateData: { realName?: string; email?: string; phone?: string; avatarUrl?: string }) {
    const data: any = {};
    if (updateData.realName !== undefined) data.realName = updateData.realName;
    if (updateData.email !== undefined) data.email = updateData.email;
    if (updateData.phone !== undefined) data.phone = updateData.phone;
    if (updateData.avatarUrl !== undefined) data.avatarUrl = updateData.avatarUrl;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, realName: true, email: true, phone: true, avatarUrl: true, status: true },
    });

    return { ...user, name: user.realName, avatar: user.avatarUrl };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) throw new UnauthorizedException('Current password is incorrect');

    const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '2h'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 7200 };
  }
}
