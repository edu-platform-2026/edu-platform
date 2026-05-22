import { Controller, Get, Post, Body, Query, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('invitations')
@ApiBearerAuth('access-token')
@Controller('invitations')
@UseGuards(RolesGuard, PermissionsGuard)
export class InvitationsController {
  constructor(
    private invitationsService: InvitationsService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.INVITATION_CREATE)
  @ApiOperation({ summary: 'Create invitation code' })
  async create(@Request() req, @Body() body: { role: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new NotFoundException('User not found');
    const invitation = await this.invitationsService.create(req.user.id, user.institutionId, body.role);
    return { code: 200, message: 'success', data: invitation };
  }

  @Get('my')
  @RequirePermissions(Permission.INVITATION_READ)
  @ApiOperation({ summary: 'Get my invitations' })
  async getMy(@Request() req) {
    const invitations = await this.invitationsService.getMyInvitations(req.user.id);
    return { code: 200, message: 'success', data: invitations };
  }

  @Public()
  @Get('check/:code')
  @ApiOperation({ summary: 'Check invitation code' })
  async checkCode(@Param('code') code: string) {
    const invitation = await this.invitationsService.getByCode(code);
    return { code: 200, message: 'success', data: invitation };
  }

  @Get('statistics')
  @RequirePermissions(Permission.INVITATION_READ)
  @ApiOperation({ summary: 'Get invitation statistics' })
  async statistics(@Request() req) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new NotFoundException('User not found');

    const userRoles: string[] = req.user.roles || [];

    if (userRoles.includes('ADMIN')) {
      const stats = await this.invitationsService.getStatistics(user.institutionId);
      return { code: 200, message: 'success', data: stats };
    } else {
      const myInvitations = await this.invitationsService.getMyInvitations(req.user.id);
      const total = myInvitations.length;
      const used = myInvitations.filter((i: any) => i.status === 1).length;
      return {
        code: 200, message: 'success',
        data: { total, used, unused: total - used },
      };
    }
  }

  @Get()
  @RequirePermissions(Permission.INVITATION_READ)
  @ApiOperation({ summary: 'Get invitation list' })
  async getAll(@Request() req, @Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new NotFoundException('User not found');

    const userRoles: string[] = req.user.roles || [];

    if (userRoles.includes('ADMIN')) {
      const result = await this.invitationsService.getAll(user.institutionId, +page, +pageSize);
      return { code: 200, message: 'success', data: result };
    } else {
      const myInvitations = await this.invitationsService.getMyInvitations(req.user.id);
      const start = (+page - 1) * +pageSize;
      const items = myInvitations.slice(start, start + +pageSize);
      return {
        code: 200, message: 'success',
        data: { items, meta: { total: myInvitations.length, page: +page, pageSize: +pageSize } },
      };
    }
  }
}
