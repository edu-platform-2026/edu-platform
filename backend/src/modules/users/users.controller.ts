import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
import { UsersService } from './users.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 用户管理控制器
 * 处理用户 CRUD、角色分配、状态管理等请求
 */
@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(RolesGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取用户列表
   */
  @Get()
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({
    summary: '获取用户列表',
    description: '分页获取用户列表，支持按关键词、状态、角色筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('institutionId') institutionId?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: number,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll(paginationDto, {
      institutionId,
      keyword,
      status,
      role,
    });
  }

  /**
   * 获取用户详情
   */
  @Get(':id')
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({
    summary: '获取用户详情',
    description: '根据 ID 获取用户的详细信息',
  })
  @ApiParam({ name: 'id', description: '用户 ID', type: 'string' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  /**
   * 创建用户
   */
  @Post()
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_CREATE)
  @ApiOperation({
    summary: '创建用户',
    description: '创建新用户账号',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '用户名或手机号已存在' })
  async create(
    @Body()
    createUserDto: {
      username: string;
      password: string;
      realName: string;
      phone?: string;
      email?: string;
      gender?: number;
      institutionId: string;
      role?: Role;
    },
  ) {
    return this.usersService.create(createUserDto);
  }

  /**
   * 更新用户信息
   */
  @Put(':id')
  @RequirePermissions(Permission.USER_UPDATE)
  @ApiOperation({
    summary: '更新用户信息',
    description: '更新用户基本信息',
  })
  @ApiParam({ name: 'id', description: '用户 ID', type: 'string' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    updateUserDto: {
      realName?: string;
      phone?: string;
      email?: string;
      avatarUrl?: string;
      gender?: number;
    },
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * 删除用户
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除用户',
    description: '软删除用户（禁用状态）',
  })
  @ApiParam({ name: 'id', description: '用户 ID', type: 'string' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
    return { message: '用户删除成功' };
  }

  /**
   * 为用户分配角色
   */
  @Post(':id/roles')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_ASSIGN_ROLE)
  @ApiOperation({
    summary: '分配角色',
    description: '为用户分配指定角色',
  })
  @ApiParam({ name: 'id', description: '用户 ID', type: 'string' })
  @ApiResponse({ status: 201, description: '角色分配成功' })
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRoleDto: { roleId: string; institutionId: string },
  ) {
    return this.usersService.assignRole(
      id,
      assignRoleDto.roleId,
      assignRoleDto.institutionId,
    );
  }

  /**
   * 移除用户角色
   */
  @Delete(':id/roles/:roleId')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_ASSIGN_ROLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '移除角色',
    description: '移除用户的指定角色',
  })
  @ApiParam({ name: 'id', description: '用户 ID', type: 'string' })
  @ApiParam({ name: 'roleId', description: '角色 ID', type: 'string' })
  @ApiResponse({ status: 200, description: '角色移除成功' })
  async removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.usersService.removeRole(id, roleId);
  }

  /**
   * 修改用户状态
   */
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_MANAGE_STATUS)
  @ApiOperation({
    summary: '修改用户状态',
    description: '启用或禁用用户',
  })
  @ApiParam({ name: 'id', description: '用户 ID', type: 'string' })
  @ApiResponse({ status: 200, description: '状态修改成功' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: { status: number },
  ) {
    return this.usersService.changeStatus(id, changeStatusDto.status);
  }

  /**
   * 重置用户密码
   */
  @Patch(':id/password')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.USER_RESET_PASSWORD)
  @ApiOperation({
    summary: '重置密码',
    description: '管理员重置用户密码',
  })
  @ApiParam({ name: 'id', description: '用户 ID', type: 'string' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: { newPassword: string },
  ) {
    return this.usersService.resetPassword(id, resetPasswordDto.newPassword);
  }
}
