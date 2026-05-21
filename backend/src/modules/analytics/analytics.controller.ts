import {
  Controller,
  Get,
  Param,
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
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 数据分析控制器
 * 提供各维度的统计分析接口
 */
@ApiTags('analytics')
@ApiBearerAuth('access-token')
@Controller('analytics')
@UseGuards(RolesGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * 获取总览数据（管理者视图）
   */
  @Get('overview')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.STATISTICS_READ)
  @ApiOperation({
    summary: '获取总览数据',
    description: '获取机构整体的统计数据，包括用户、班级、课程、作业等维度',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOverview(
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.analyticsService.getOverview(institutionId);
  }

  /**
   * 获取教学数据（教师视图）
   */
  @Get('teaching')
  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.STATISTICS_READ)
  @ApiOperation({
      summary: '获取教学数据',
    description: '获取教师的教学统计数据，包括课程、排课、上课记录等',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTeachingData(
    @CurrentUser('id') teacherId: string,
  ) {
    return this.analyticsService.getTeachingData(teacherId);
  }

  /**
   * 获取作业统计数据
   */
  @Get('assignments')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.STATISTICS_READ)
  @ApiOperation({
    summary: '获取作业统计',
    description: '获取作业相关的统计数据，包括作业数量、提交率、平均分等',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAssignmentData(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const teacherId = role === 'TEACHER' ? userId : undefined;
    return this.analyticsService.getAssignmentData(institutionId, teacherId);
  }

  /**
   * 获取学生个人数据
   */
  @Get('student/:id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @RequirePermissions(Permission.STATISTICS_READ)
  @ApiOperation({
    summary: '获取学生数据',
    description: '获取指定学生的个人统计数据，包括作业提交率、成绩分布等',
  })
  @ApiParam({ name: 'id', description: '学生 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentData(
    @Param('id', ParseUUIDPipe) studentId: string,
  ) {
    return this.analyticsService.getStudentData(studentId);
  }
}
