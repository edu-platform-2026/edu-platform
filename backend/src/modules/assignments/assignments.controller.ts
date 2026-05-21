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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 作业管理控制器
 * 处理作业 CRUD、发布、统计等请求
 */
@ApiTags('assignments')
@ApiBearerAuth('access-token')
@Controller('assignments')
@UseGuards(RolesGuard, PermissionsGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /**
   * 获取作业列表
   */
  @Get()
  @RequirePermissions(Permission.ASSIGNMENT_READ)
  @ApiOperation({
    summary: '获取作业列表',
    description: '分页获取作业列表，支持按关键词、班级、教师、类型、状态筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('classId') classId?: string,
    @Query('courseId') courseId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('type') type?: number,
    @Query('status') status?: number,
    @Query('subject') subject?: string,
  ) {
    return this.assignmentsService.findAll(institutionId, paginationDto, {
      keyword,
      classId,
      courseId,
      teacherId,
      type,
      status,
      subject,
    });
  }

  /**
   * 获取作业详情
   */
  @Get(':id')
  @RequirePermissions(Permission.ASSIGNMENT_READ)
  @ApiOperation({
    summary: '获取作业详情',
    description: '根据 ID 获取作业详细信息，包含提交列表',
  })
  @ApiParam({ name: 'id', description: '作业 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '作业不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.findById(id);
  }

  /**
   * 创建作业
   */
  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.ASSIGNMENT_CREATE)
  @ApiOperation({
    summary: '创建作业',
    description: '创建新作业（默认为草稿状态）',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 404, description: '班级或课程不存在' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(institutionId, teacherId, dto);
  }

  /**
   * 更新作业
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.ASSIGNMENT_UPDATE)
  @ApiOperation({
    summary: '更新作业',
    description: '更新作业信息',
  })
  @ApiParam({ name: 'id', description: '作业 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '作业不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      type?: number;
      subject?: string;
      attachments?: any[];
      dueDate?: string;
      maxScore?: number;
      status?: number;
    },
  ) {
    return this.assignmentsService.update(id, body);
  }

  /**
   * 删除作业
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.ASSIGNMENT_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除作业',
    description: '删除作业（有提交记录则软删除）',
  })
  @ApiParam({ name: 'id', description: '作业 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '作业不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.assignmentsService.remove(id);
    return { message: '作业删除成功' };
  }

  /**
   * 发布作业
   */
  @Post(':id/publish')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.ASSIGNMENT_CREATE)
  @ApiOperation({
    summary: '发布作业',
    description: '将草稿作业发布给学生',
  })
  @ApiParam({ name: 'id', description: '作业 ID' })
  @ApiResponse({ status: 200, description: '发布成功' })
  @ApiResponse({ status: 404, description: '作业不存在' })
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.publish(id);
  }

  /**
   * 获取作业统计
   */
  @Get(':id/statistics')
  @RequirePermissions(Permission.ASSIGNMENT_READ)
  @ApiOperation({
    summary: '获取作业统计',
    description: '获取作业的提交率、平均分等统计数据',
  })
  @ApiParam({ name: 'id', description: '作业 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '作业不存在' })
  async getStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.getStatistics(id);
  }
}
