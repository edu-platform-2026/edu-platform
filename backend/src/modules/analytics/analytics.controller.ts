import {
  Controller,
  Get,
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
  ApiQuery,
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
   * 获取仪表盘数据（前端 Dashboard 调用）
   */
  @Get('dashboard')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({
    summary: '获取仪表盘数据',
    description: '获取管理者仪表盘的统计数据概览',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDashboard(
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.analyticsService.getOverview(institutionId);
  }

  /**
   * 获取总览数据（管理者视图）
   */
  @Get('overview')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.ANALYTICS_READ)
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
  @RequirePermissions(Permission.ANALYTICS_READ)
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
  @RequirePermissions(Permission.ANALYTICS_READ)
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
  @RequirePermissions(Permission.ANALYTICS_READ)
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

  /**
   * 获取学生注册趋势（按月累计）
   */
  @Get('student-trend')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({
    summary: '获取学生注册趋势',
    description: '获取机构每月学生注册的累计增长数据',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentTrend(
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.analyticsService.getStudentTrend(institutionId);
  }

  /**
   * 获取课程分布（按学科统计）
   */
  @Get('course-distribution')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({
    summary: '获取课程分布',
    description: '按学科统计课程分布及各学科学生人数，教师角色仅返回自己的课程数据',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCourseDistribution(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const teacherId = role === 'TEACHER' ? userId : undefined;
    return this.analyticsService.getCourseDistribution(institutionId, teacherId);
  }

  /**
   * 获取教师绩效数据
   */
  @Get('teacher-performance')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({
    summary: '获取教师绩效',
    description: '获取各教师的课程数、学生数、平均分、作业数等绩效指标',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTeacherPerformance(
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.analyticsService.getTeacherPerformance(institutionId);
  }

  /**
   * 获取营收趋势（模拟数据）
   */
  @Get('revenue-trend')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({
    summary: '获取营收趋势',
    description: '获取每月营收趋势数据（基于提交数据的模拟值，提交数 * 100）',
  })
  @ApiQuery({ name: 'year', required: false, description: '年份，默认当前年' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRevenueTrend(
    @CurrentUser('institutionId') institutionId: string,
    @Query('year') year?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.analyticsService.getRevenueTrend(institutionId, yearNum);
  }

  /**
   * 获取班级对比数据
   */
  @Get('class-comparison')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({
    summary: '获取班级对比',
    description: '获取各班级的学生数、平均分、及格率等对比数据',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getClassComparison(
    @CurrentUser('institutionId') institutionId: string,
  ) {
    return this.analyticsService.getClassComparison(institutionId);
  }
}
