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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 缴费管理控制器
 * 处理缴费记录 CRUD、确认缴费等请求
 */
@ApiTags('payments')
@ApiBearerAuth('access-token')
@Controller('payments')
@UseGuards(RolesGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * 获取缴费列表
   * 管理员查看所有，学生查看自己的
   */
  @Get()
  @RequirePermissions(Permission.PAYMENT_READ)
  @ApiOperation({
    summary: '获取缴费列表',
    description: '分页获取缴费列表，管理员查看所有，学生查看自己的缴费记录',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: number,
    @Query('type') type?: number,
    @Query('studentId') studentId?: string,
  ) {
    return this.paymentsService.findAll(institutionId, paginationDto, {
      status,
      type,
      studentId,
      userId,
      role,
    });
  }

  /**
   * 获取缴费详情
   */
  @Get(':id')
  @RequirePermissions(Permission.PAYMENT_READ)
  @ApiOperation({
    summary: '获取缴费详情',
    description: '根据 ID 获取缴费记录详细信息',
  })
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '缴费记录不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findById(id);
  }

  /**
   * 创建缴费记录（仅管理员）
   */
  @Post()
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.PAYMENT_CREATE)
  @ApiOperation({
    summary: '创建缴费记录',
    description: '创建新的缴费记录（仅管理员）',
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(institutionId, dto);
  }

  /**
   * 更新缴费记录（仅管理员）
   */
  @Put(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.PAYMENT_UPDATE)
  @ApiOperation({
    summary: '更新缴费记录',
    description: '更新缴费记录信息（仅管理员）',
  })
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '缴费记录不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, dto);
  }

  /**
   * 确认缴费（仅管理员）
   */
  @Put(':id/pay')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.PAYMENT_PAY)
  @ApiOperation({
    summary: '确认缴费',
    description: '将缴费记录标记为已缴费状态（仅管理员）',
  })
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiResponse({ status: 200, description: '确认成功' })
  @ApiResponse({ status: 400, description: '状态不允许此操作' })
  @ApiResponse({ status: 404, description: '缴费记录不存在' })
  async markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('paymentMethod') paymentMethod?: string,
  ) {
    return this.paymentsService.markAsPaid(id, paymentMethod);
  }

  /**
   * 删除缴费记录（仅管理员）
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.PAYMENT_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除缴费记录',
    description: '删除缴费记录（仅管理员）',
  })
  @ApiParam({ name: 'id', description: '缴费记录 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '缴费记录不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.paymentsService.remove(id);
    return { message: '缴费记录删除成功' };
  }
}
