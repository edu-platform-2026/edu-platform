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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 课程管理控制器
 * 处理课程 CRUD 请求
 */
@ApiTags('courses')
@ApiBearerAuth('access-token')
@Controller('courses')
@UseGuards(RolesGuard, PermissionsGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * 获取课程列表
   */
  @Get()
  @RequirePermissions(Permission.COURSE_READ)
  @ApiOperation({
    summary: '获取课程列表',
    description: '分页获取课程列表，支持按关键词、班级、教师、学科筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('classId') classId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('subject') subject?: string,
    @Query('status') status?: number,
  ) {
    return this.coursesService.findAll(institutionId, paginationDto, {
      keyword,
      classId,
      teacherId,
      subject,
      status,
    });
  }

  /**
   * 获取课程详情
   */
  @Get(':id')
  @RequirePermissions(Permission.COURSE_READ)
  @ApiOperation({
    summary: '获取课程详情',
    description: '根据 ID 获取课程详细信息，包含排课和统计',
  })
  @ApiParam({ name: 'id', description: '课程 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '课程不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findById(id);
  }

  /**
   * 创建课程
   */
  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.COURSE_CREATE)
  @ApiOperation({
    summary: '创建课程',
    description: '创建新课程',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 404, description: '班级或教师不存在' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.create(institutionId, dto);
  }

  /**
   * 更新课程信息
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.COURSE_UPDATE)
  @ApiOperation({
    summary: '更新课程',
    description: '更新课程基本信息',
  })
  @ApiParam({ name: 'id', description: '课程 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '课程不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      name?: string;
      subject?: string;
      description?: string;
      totalHours?: number;
      teacherId?: string;
      status?: number;
    },
  ) {
    return this.coursesService.update(id, body);
  }

  /**
   * 删除课程
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.COURSE_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除课程',
    description: '删除课程（有上课记录则软删除）',
  })
  @ApiParam({ name: 'id', description: '课程 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '课程不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.coursesService.remove(id);
    return { message: '课程删除成功' };
  }

  /**
   * 获取当前教师的课程列表
   */
  @Get('my/list')
  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.COURSE_READ)
  @ApiOperation({
    summary: '获取我的课程',
    description: '获取当前教师的课程列表',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findMyCourses(@CurrentUser('id') teacherId: string) {
    return this.coursesService.findByTeacher(teacherId);
  }
}
