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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 排课管理控制器
 * 处理排课 CRUD、课表查询等请求
 */
@ApiTags('schedules')
@ApiBearerAuth('access-token')
@Controller('schedules')
@UseGuards(RolesGuard, PermissionsGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * 获取排课列表
   */
  @Get()
  @RequirePermissions(Permission.COURSE_READ)
  @ApiOperation({
    summary: '获取排课列表',
    description: '分页获取排课列表，支持按课程、星期、教师筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('courseId') courseId?: string,
    @Query('dayOfWeek') dayOfWeek?: number,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.scheduleService.findAll(paginationDto, {
      courseId,
      dayOfWeek,
      teacherId,
    });
  }

  /**
   * 获取当前教师的排课
   */
  @Get('my')
  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.COURSE_READ)
  @ApiOperation({
    summary: '获取我的排课',
    description: '获取当前教师的所有排课信息',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findMySchedules(@CurrentUser('id') teacherId: string) {
    return this.scheduleService.findMySchedules(teacherId);
  }

  /**
   * 创建排课
   */
  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.COURSE_SCHEDULE)
  @ApiOperation({
    summary: '创建排课',
    description: '为课程创建排课信息',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '时间冲突或参数错误' })
  async create(@Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(dto);
  }

  /**
   * 更新排课
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.COURSE_SCHEDULE)
  @ApiOperation({
    summary: '更新排课',
    description: '更新排课信息',
  })
  @ApiParam({ name: 'id', description: '排课 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '排课不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      room?: string;
      effectiveFrom?: string;
      effectiveUntil?: string;
    },
  ) {
    return this.scheduleService.update(id, body);
  }

  /**
   * 删除排课
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.COURSE_SCHEDULE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除排课',
    description: '删除排课记录（需无关联上课记录）',
  })
  @ApiParam({ name: 'id', description: '排课 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '存在关联上课记录' })
  @ApiResponse({ status: 404, description: '排课不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.scheduleService.remove(id);
    return { message: '排课删除成功' };
  }
}
