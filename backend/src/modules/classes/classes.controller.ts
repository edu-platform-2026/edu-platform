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
  ApiQuery,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 班级管理控制器
 * 处理班级 CRUD、学生管理等请求
 */
@ApiTags('classes')
@ApiBearerAuth('access-token')
@Controller('classes')
@UseGuards(RolesGuard, PermissionsGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  /**
   * 获取班级列表
   */
  @Get()
  @RequirePermissions(Permission.CLASS_READ)
  @ApiOperation({
    summary: '获取班级列表',
    description: '分页获取班级列表，支持按关键词、年级筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('grade') grade?: string,
    @Query('status') status?: number,
    @Query('homeroomTeacherId') homeroomTeacherId?: string,
  ) {
    return this.classesService.findAll(institutionId, paginationDto, {
      keyword,
      grade,
      status,
      homeroomTeacherId,
    });
  }

  /**
   * 获取班级详情
   */
  @Get(':id')
  @RequirePermissions(Permission.CLASS_READ)
  @ApiOperation({
    summary: '获取班级详情',
    description: '根据 ID 获取班级的详细信息，包含学生列表和课程',
  })
  @ApiParam({ name: 'id', description: '班级 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '班级不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.findById(id);
  }

  /**
   * 创建班级
   */
  @Post()
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.CLASS_CREATE)
  @ApiOperation({
    summary: '创建班级',
    description: '创建新班级',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '同名班级已存在' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @Body() dto: CreateClassDto,
  ) {
    return this.classesService.create(institutionId, dto);
  }

  /**
   * 更新班级信息
   */
  @Put(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.CLASS_UPDATE)
  @ApiOperation({
    summary: '更新班级信息',
    description: '更新班级基本信息',
  })
  @ApiParam({ name: 'id', description: '班级 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '班级不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.update(id, dto);
  }

  /**
   * 删除班级
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.CLASS_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除班级',
    description: '软删除班级（停用状态），需先移除所有学生和课程',
  })
  @ApiParam({ name: 'id', description: '班级 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '班级仍有学生或课程' })
  @ApiResponse({ status: 404, description: '班级不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.classesService.remove(id);
    return { message: '班级删除成功' };
  }

  /**
   * 添加学生到班级
   */
  @Post(':id/students')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.CLASS_MANAGE_STUDENTS)
  @ApiOperation({
    summary: '添加学生',
    description: '将学生添加到指定班级',
  })
  @ApiParam({ name: 'id', description: '班级 ID' })
  @ApiResponse({ status: 201, description: '添加成功' })
  @ApiResponse({ status: 409, description: '学生已在班级中' })
  async addStudent(
    @Param('id', ParseUUIDPipe) classId: string,
    @Body() body: { studentId: string; parentId?: string },
  ) {
    return this.classesService.addStudent(classId, body.studentId, body.parentId);
  }

  /**
   * 从班级移除学生
   */
  @Delete(':id/students/:studentId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.CLASS_MANAGE_STUDENTS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '移除学生',
    description: '将学生从指定班级移除',
  })
  @ApiParam({ name: 'id', description: '班级 ID' })
  @ApiParam({ name: 'studentId', description: '学生 ID' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 404, description: '学生不在该班级中' })
  async removeStudent(
    @Param('id', ParseUUIDPipe) classId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.classesService.removeStudent(classId, studentId);
  }

  /**
   * 获取班级学生列表
   */
  @Get(':id/students')
  @RequirePermissions(Permission.CLASS_READ)
  @ApiOperation({
    summary: '获取班级学生列表',
    description: '获取指定班级的所有学生信息',
  })
  @ApiParam({ name: 'id', description: '班级 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '班级不存在' })
  async getStudents(@Param('id', ParseUUIDPipe) classId: string) {
    return this.classesService.getStudents(classId);
  }
}
