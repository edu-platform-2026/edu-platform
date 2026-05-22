import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';
import { ParentService } from './parent.service';

@ApiTags('parent')
@ApiBearerAuth('access-token')
@Controller('parent')
@UseGuards(RolesGuard, PermissionsGuard)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('students')
  @Roles(Role.PARENT)
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Get bound students' })
  async getBoundStudents(@Request() req) {
    const students = await this.parentService.getBoundStudents(req.user.id);
    return { code: 200, message: 'success', data: students };
  }

  @Get('search-students')
  @Roles(Role.PARENT)
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Search students to bind' })
  async searchStudents(@Request() req, @Query('keyword') keyword: string) {
    if (!keyword || keyword.trim().length < 1) {
      return { code: 200, message: 'success', data: [] };
    }
    const students = await this.parentService.searchStudents(keyword.trim(), req.user.institutionId);
    return { code: 200, message: 'success', data: students };
  }

  @Post('bind-student')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Bind parent to student' })
  async bindStudent(@Request() req, @Body() body: { studentId: string }) {
    const result = await this.parentService.bindStudent(req.user.id, body.studentId);
    return { code: 200, message: 'success', data: result };
  }

  @Delete('unbind-student/:studentId')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Unbind parent from student' })
  async unbindStudent(@Request() req, @Param('studentId') studentId: string) {
    const result = await this.parentService.unbindStudent(req.user.id, studentId);
    return { code: 200, message: 'success', data: result };
  }

  @Get('student-assignments')
  @Roles(Role.PARENT)
  @RequirePermissions(Permission.ASSIGNMENT_READ)
  @ApiOperation({ summary: 'Get bound student assignments' })
  async getStudentAssignments(@Request() req, @Query('studentId') studentId: string) {
    const assignments = await this.parentService.getStudentAssignments(studentId);
    return { code: 200, message: 'success', data: assignments };
  }

  @Get('student-progress')
  @Roles(Role.PARENT)
  @RequirePermissions(Permission.ANALYTICS_READ)
  @ApiOperation({ summary: 'Get bound student progress' })
  async getStudentProgress(@Request() req, @Query('studentId') studentId: string) {
    const progress = await this.parentService.getStudentProgress(studentId);
    return { code: 200, message: 'success', data: progress };
  }
}