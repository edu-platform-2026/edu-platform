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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 站内消息控制器
 * 处理消息发送、接收、已读标记等请求
 */
@ApiTags('messages')
@ApiBearerAuth('access-token')
@Controller('messages')
@UseGuards(RolesGuard, PermissionsGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * 获取消息列表
   * 管理员查看所有，其他角色查看与自己相关的
   */
  @Get()
  @RequirePermissions(Permission.MESSAGE_READ)
  @ApiOperation({
    summary: '获取消息列表',
    description: '分页获取消息列表，管理员查看所有消息，其他角色查看与自己相关的消息',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() paginationDto: PaginationDto,
    @Query('type') type?: number,
  ) {
    return this.messagesService.findAll(institutionId, paginationDto, {
      type,
      userId,
      role,
    });
  }

  /**
   * 获取当前用户的消息
   */
  @Get('my')
  @RequirePermissions(Permission.MESSAGE_READ)
  @ApiOperation({
    summary: '获取我的消息',
    description: '获取当前用户发送和接收的所有消息',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findMyMessages(
    @CurrentUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.messagesService.findMyMessages(userId, paginationDto);
  }

  /**
   * 获取消息详情
   */
  @Get(':id')
  @RequirePermissions(Permission.MESSAGE_READ)
  @ApiOperation({
    summary: '获取消息详情',
    description: '根据 ID 获取消息详细信息',
  })
  @ApiParam({ name: 'id', description: '消息 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '消息不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.messagesService.findById(id);
  }

  /**
   * 发送消息
   */
  @Post()
  @RequirePermissions(Permission.MESSAGE_CREATE)
  @ApiOperation({
    summary: '发送消息',
    description: '发送一条站内消息',
  })
  @ApiResponse({ status: 201, description: '发送成功' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') senderId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(institutionId, senderId, dto);
  }

  /**
   * 标记消息为已读
   */
  @Put(':id/read')
  @RequirePermissions(Permission.MESSAGE_READ)
  @ApiOperation({
    summary: '标记消息为已读',
    description: '将指定消息标记为已读状态（仅接收者可操作）',
  })
  @ApiParam({ name: 'id', description: '消息 ID' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 403, description: '无权操作' })
  @ApiResponse({ status: 404, description: '消息不存在' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.markAsRead(id, userId);
  }

  /**
   * 删除消息
   */
  @Delete(':id')
  @RequirePermissions(Permission.MESSAGE_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除消息',
    description: '删除指定消息',
  })
  @ApiParam({ name: 'id', description: '消息 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '消息不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.messagesService.remove(id);
    return { message: '消息删除成功' };
  }
}
