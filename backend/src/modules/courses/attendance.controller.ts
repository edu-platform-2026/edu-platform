import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 上课记录管理控制器
 * 处理上课记录创建、更新、查询、统计等请求
 */
@ApiTags('attendances')
@ApiBearerAuth('access-token')
@Controller('attendances')
@UseGuards(RolesGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * 获取上课记录列表
   */
  @Get()
  @RequirePermissions(Permission.COURSE_READ)
  @ApiOperation({
    summary: '获取上课记录列表',
    description: '分页获取上课记录，支持按课程、教师、日期范围、状态筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('courseId') courseId?: string,
    @Query('scheduleId') scheduleId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: number,
  ) {
    return this.attendanceService.findAll(paginationDto, {
      courseId,
      scheduleId,
      teacherId,
      startDate,
      endDate,
      status,
    });
  }

  /**
   * 创建上课记录
   */
  @Post()
  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.COURSE_ATTENDANCE)
  @ApiOperation({
    summary: '创建上课记录',
    description: '教师记录实际上课情况',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '该日期已有记录' })
  async create(
    @CurrentUser('id') teacherId: string,
    @Body() dto: CreateAttendanceDto,
  ) {
    return this.attendanceService.create(teacherId, dto);
  }

  /**
   * 更新上课记录
   */
  @Put(':id')
  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.COURSE_ATTENDANCE)
  @ApiOperation({
    summary: '更新上课记录',
    description: '更新上课记录的状态或反馈',
  })
  @ApiParam({ name: 'id', description: '上课记录 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      startTime?: string;
      endTime?: string;
      status?: number;
      feedback?: string;
    },
  ) {
    return this.attendanceService.update(id, body);
  }

  /**
   * 获取上课统计数据
   */
  @Get('statistics')
  @RequirePermissions(Permission.COURSE_READ)
  @ApiOperation({
    summary: '获取上课统计',
    description: '获取上课记录统计信息，可按课程或教师筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics(
    @Query('courseId') courseId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.attendanceService.getStatistics({ courseId, teacherId });
  }
}
