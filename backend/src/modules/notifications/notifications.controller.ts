import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 通知管理控制器
 * 处理通知 CRUD、标记已读、未读统计等请求
 */
@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(RolesGuard, PermissionsGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * 获取通知列表（管理端）
   */
  @Get()
  @RequirePermissions(Permission.NOTIFICATION_READ)
  @ApiOperation({
    summary: '获取通知列表',
    description: '分页获取通知列表，支持按关键词、类型、紧急状态筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('type') type?: number,
    @Query('isUrgent') isUrgent?: boolean,
    @Query('targetRole') targetRole?: string,
  ) {
    return this.notificationsService.findAll(institutionId, paginationDto, {
      keyword,
      type,
      isUrgent,
      targetRole,
    });
  }

  /**
   * 获取我的通知列表（包含已读状态）
   */
  @Get('my')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  @ApiOperation({
    summary: '获取我的通知',
    description: '获取当前用户的通知列表，包含已读/未读状态',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findMyNotifications(
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.notificationsService.findForUser(userId, institutionId, paginationDto);
  }

  /**
   * 获取未读通知数量
   */
  @Get('unread-count')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  @ApiOperation({
    summary: '获取未读通知数量',
    description: '获取当前用户的未读通知数量',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUnreadCount(
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.notificationsService.getUnreadCount(userId, institutionId);
  }

  /**
   * 获取通知详情
   */
  @Get(':id')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  @ApiOperation({
    summary: '获取通知详情',
    description: '根据 ID 获取通知详细信息',
  })
  @ApiParam({ name: 'id', description: '通知 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findById(id);
  }

  /**
   * 创建通知
   */
  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.NOTIFICATION_CREATE)
  @ApiOperation({
    summary: '创建通知',
    description: '创建新通知并推送给目标用户',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') senderId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    const notification = await this.notificationsService.create(
      institutionId,
      senderId,
      dto,
    );

    // 实时推送通知
    if (notification.publishedAt) {
      const notificationPayload = {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        isUrgent: notification.isUrgent,
        sender: notification.sender,
        createdAt: notification.createdAt,
      };

      // 按目标推送
      if (dto.targetRole) {
        await this.notificationsGateway.sendToRole(
          institutionId,
          dto.targetRole,
          notificationPayload,
        );
      } else if (dto.targetUsers && dto.targetUsers.length > 0) {
        dto.targetUsers.forEach((userId) => {
          this.notificationsGateway.sendToUser(userId, notificationPayload);
        });
      } else {
        // 广播给整个机构
        this.notificationsGateway.broadcastToInstitution(
          institutionId,
          notificationPayload,
        );
      }
    }

    return notification;
  }

  /**
   * 更新通知
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.NOTIFICATION_UPDATE)
  @ApiOperation({
    summary: '更新通知',
    description: '更新通知信息',
  })
  @ApiParam({ name: 'id', description: '通知 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      type?: number;
      targetRole?: string;
      targetUsers?: string[];
      isUrgent?: boolean;
    },
  ) {
    return this.notificationsService.update(id, body);
  }

  /**
   * 删除通知
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.NOTIFICATION_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除通知',
    description: '删除通知',
  })
  @ApiParam({ name: 'id', description: '通知 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificationsService.remove(id);
    return { message: '通知删除成功' };
  }

  /**
   * 标记通知为已读
   */
  @Post(':id/read')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  @ApiOperation({
    summary: '标记已读',
    description: '将指定通知标记为已读',
  })
  @ApiParam({ name: 'id', description: '通知 ID' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) notificationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    const result = await this.notificationsService.markAsRead(notificationId, userId);

    // 推送未读数量更新
    const { unreadCount } = await this.notificationsService.getUnreadCount(
      userId,
      institutionId,
    );
    this.notificationsGateway.sendUnreadCount(userId, unreadCount);

    return result;
  }

  /**
   * 批量标记通知为已读
   */
  @Post('read-batch')
  @RequirePermissions(Permission.NOTIFICATION_READ)
  @ApiOperation({
    summary: '批量标记已读',
    description: '将多条通知批量标记为已读',
  })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markMultipleAsRead(
    @Body() body: { notificationIds: string[] },
    @CurrentUser('id') userId: string,
    @CurrentUser('institutionId') institutionId: string,
  ) {
    const result = await this.notificationsService.markMultipleAsRead(
      body.notificationIds,
      userId,
    );

    // 推送未读数量更新
    const { unreadCount } = await this.notificationsService.getUnreadCount(
      userId,
      institutionId,
    );
    this.notificationsGateway.sendUnreadCount(userId, unreadCount);

    return result;
  }
}
