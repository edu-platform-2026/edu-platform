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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 反馈管理控制器
 * 处理反馈 CRUD、回复等请求
 */
@ApiTags('feedback')
@ApiBearerAuth('access-token')
@Controller('feedback')
@UseGuards(RolesGuard, PermissionsGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * 获取反馈列表
   */
  @Get()
  @RequirePermissions(Permission.FEEDBACK_READ)
  @ApiOperation({
    summary: '获取反馈列表',
    description: '分页获取反馈列表，支持按关键词、类型、状态筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('status') status?: number,
    @Query('parentId') parentId?: string,
  ) {
    return this.feedbackService.findAll(institutionId, paginationDto, {
      keyword,
      category,
      status,
      parentId,
    });
  }

  /**
   * 获取我的反馈
   */
  @Get('my')
  @RequirePermissions(Permission.FEEDBACK_READ)
  @ApiOperation({
    summary: '获取我的反馈',
    description: '获取当前用户提交的所有反馈',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findMyFeedbacks(
    @CurrentUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.feedbackService.findMyFeedbacks(userId, paginationDto);
  }

  /**
   * 获取反馈详情
   */
  @Get(':id')
  @RequirePermissions(Permission.FEEDBACK_READ)
  @ApiOperation({
    summary: '获取反馈详情',
    description: '根据 ID 获取反馈详细信息，包含所有回复',
  })
  @ApiParam({ name: 'id', description: '反馈 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '反馈不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedbackService.findById(id);
  }

  /**
   * 创建反馈
   */
  @Post()
  @RequirePermissions(Permission.FEEDBACK_CREATE)
  @ApiOperation({
    summary: '提交反馈',
    description: '提交新的反馈',
  })
  @ApiResponse({ status: 201, description: '提交成功' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(institutionId, userId, dto);
  }

  /**
   * 更新反馈
   */
  @Put(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.FEEDBACK_UPDATE)
  @ApiOperation({
    summary: '更新反馈',
    description: '更新反馈信息或状态',
  })
  @ApiParam({ name: 'id', description: '反馈 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '反馈不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      category?: string;
      status?: number;
    },
  ) {
    return this.feedbackService.update(id, body);
  }

  /**
   * 删除反馈
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.FEEDBACK_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除反馈',
    description: '删除反馈',
  })
  @ApiParam({ name: 'id', description: '反馈 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '反馈不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.feedbackService.remove(id);
    return { message: '反馈删除成功' };
  }

  /**
   * 回复反馈
   */
  @Post(':id/reply')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.FEEDBACK_REPLY)
  @ApiOperation({
    summary: '回复反馈',
    description: '回复用户的反馈，可同时更新反馈状态',
  })
  @ApiParam({ name: 'id', description: '反馈 ID' })
  @ApiResponse({ status: 201, description: '回复成功' })
  @ApiResponse({ status: 404, description: '反馈不存在' })
  async reply(
    @Param('id', ParseUUIDPipe) feedbackId: string,
    @CurrentUser('id') replierId: string,
    @Body() dto: ReplyFeedbackDto,
  ) {
    return this.feedbackService.reply(feedbackId, replierId, dto);
  }
}
