import {
  Controller,
  Get,
  Post,
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
import { SubmissionsService } from './submissions.service';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 作业提交管理控制器
 * 处理作业提交、批改等请求
 */
@ApiTags('submissions')
@ApiBearerAuth('access-token')
@Controller('submissions')
@UseGuards(RolesGuard, PermissionsGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  /**
   * 获取提交列表
   */
  @Get()
  @RequirePermissions(Permission.ASSIGNMENT_READ)
  @ApiOperation({
    summary: '获取提交列表',
    description: '分页获取作业提交列表，支持按作业、学生、状态筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('assignmentId') assignmentId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: number,
  ) {
    return this.submissionsService.findAll(paginationDto, {
      assignmentId,
      studentId,
      status,
    });
  }

  /**
   * 提交作业
   */
  @Post('assignments/:assignmentId/submit')
  @Roles(Role.STUDENT)
  @RequirePermissions(Permission.ASSIGNMENT_SUBMIT)
  @ApiOperation({
    summary: '提交作业',
    description: '学生提交作业，支持内容和附件',
  })
  @ApiParam({ name: 'assignmentId', description: '作业 ID' })
  @ApiResponse({ status: 201, description: '提交成功' })
  @ApiResponse({ status: 400, description: '作业未发布' })
  @ApiResponse({ status: 409, description: '已提交过该作业' })
  async submit(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.submissionsService.submit(assignmentId, studentId, dto);
  }

  /**
   * 批改作业
   */
  @Post(':id/grade')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.ASSIGNMENT_GRADE)
  @ApiOperation({
    summary: '批改作业',
    description: '教师批改学生提交的作业，给出分数和评语',
  })
  @ApiParam({ name: 'id', description: '提交记录 ID' })
  @ApiResponse({ status: 200, description: '批改成功' })
  @ApiResponse({ status: 404, description: '提交记录不存在' })
  async grade(
    @Param('id', ParseUUIDPipe) submissionId: string,
    @CurrentUser('id') graderId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.submissionsService.grade(submissionId, graderId, dto);
  }

  /**
   * 获取我的提交列表
   */
  @Get('my')
  @Roles(Role.STUDENT)
  @RequirePermissions(Permission.ASSIGNMENT_READ)
  @ApiOperation({
    summary: '获取我的提交',
    description: '获取当前学生的所有作业提交记录',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findMySubmissions(
    @CurrentUser('id') studentId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.submissionsService.findByStudent(studentId, paginationDto);
  }

  /**
   * 获取某作业中我的提交
   */
  @Get('assignments/:assignmentId/my')
  @Roles(Role.STUDENT)
  @RequirePermissions(Permission.ASSIGNMENT_READ)
  @ApiOperation({
    summary: '获取我在某作业的提交',
    description: '获取当前学生在指定作业中的提交记录',
  })
  @ApiParam({ name: 'assignmentId', description: '作业 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findMySubmissionForAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.submissionsService.findByStudentAndAssignment(
      assignmentId,
      studentId,
    );
  }
}
