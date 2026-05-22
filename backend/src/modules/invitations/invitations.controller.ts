import { Controller, Get, Post, Body, Query, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('invitations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(
    private invitationsService: InvitationsService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建邀请码' })
  async create(@Request() req, @Body() body: { role: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new NotFoundException('用户不存在');
    const invitation = await this.invitationsService.create(req.user.id, user.institutionId, body.role);
    return { code: 200, message: 'success', data: invitation };
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的邀请列表' })
  async getMy(@Request() req) {
    const invitations = await this.invitationsService.getMyInvitations(req.user.id);
    return { code: 200, message: 'success', data: invitations };
  }

  @Public()
  @Get('check/:code')
  @ApiOperation({ summary: '检查邀请码' })
  async checkCode(@Param('code') code: string) {
    const invitation = await this.invitationsService.getByCode(code);
    return { code: 200, message: 'success', data: invitation };
  }

  @Get('statistics')
  @ApiOperation({ summary: '邀请统计（管理员）' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async statistics(@Request() req) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new NotFoundException('用户不存在');
    const stats = await this.invitationsService.getStatistics(user.institutionId);
    return { code: 200, message: 'success', data: stats };
  }

  @Get()
  @ApiOperation({ summary: '邀请列表（管理员）' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAll(@Request() req, @Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new NotFoundException('用户不存在');
    const result = await this.invitationsService.getAll(user.institutionId, +page, +pageSize);
    return { code: 200, message: 'success', data: result };
  }
}
