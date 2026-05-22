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
} from '@nestjs/swagger';
import { OperationLogsService } from './operation-logs.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 操作日志控制器
 * 处理操作日志查询请求（仅管理员可访问）
 */
@ApiTags('operation-logs')
@ApiBearerAuth('access-token')
@Controller('operation-logs')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard, PermissionsGuard)
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  /**
   * 获取操作日志列表
   */
  @Get()
  @RequirePermissions(Permission.OPERATION_LOG_READ)
  @ApiOperation({
    summary: '获取操作日志列表',
    description: '分页获取操作日志列表，支持按模块、操作类型、用户、时间范围筛选（仅管理员）',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.operationLogsService.findAll(institutionId, paginationDto, {
      module,
      action,
      userId,
      startDate,
      endDate,
    });
  }

  /**
   * 获取操作日志详情
   */
  @Get(':id')
  @RequirePermissions(Permission.OPERATION_LOG_READ)
  @ApiOperation({
    summary: '获取操作日志详情',
    description: '根据 ID 获取操作日志详细信息（仅管理员）',
  })
  @ApiParam({ name: 'id', description: '操作日志 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '操作日志不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.operationLogsService.findById(id);
  }
}
