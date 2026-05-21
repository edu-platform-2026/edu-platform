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
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 教学资源管理控制器
 * 处理资源 CRUD、下载、搜索等请求
 */
@ApiTags('resources')
@ApiBearerAuth('access-token')
@Controller('resources')
@UseGuards(RolesGuard, PermissionsGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  /**
   * 获取资源列表
   */
  @Get()
  @RequirePermissions(Permission.RESOURCE_READ)
  @ApiOperation({
    summary: '获取资源列表',
    description: '分页获取教学资源列表，支持按关键词、分类、学科筛选',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('subject') subject?: string,
    @Query('uploaderId') uploaderId?: string,
    @Query('isPublic') isPublic?: boolean,
  ) {
    return this.resourcesService.findAll(institutionId, paginationDto, {
      keyword,
      category,
      subject,
      uploaderId,
      isPublic,
    });
  }

  /**
   * 获取资源详情
   */
  @Get(':id')
  @RequirePermissions(Permission.RESOURCE_READ)
  @ApiOperation({
    summary: '获取资源详情',
    description: '根据 ID 获取资源详细信息',
  })
  @ApiParam({ name: 'id', description: '资源 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.resourcesService.findById(id);
  }

  /**
   * 上传资源
   */
  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.RESOURCE_CREATE)
  @ApiOperation({
    summary: '上传资源',
    description: '上传新的教学资源',
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') uploaderId: string,
    @Body() dto: CreateResourceDto,
  ) {
    return this.resourcesService.create(institutionId, uploaderId, dto);
  }

  /**
   * 更新资源信息
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.RESOURCE_UPDATE)
  @ApiOperation({
    summary: '更新资源',
    description: '更新资源的标题、描述、分类等信息',
  })
  @ApiParam({ name: 'id', description: '资源 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      category?: string;
      subject?: string;
      isPublic?: boolean;
      tags?: string[];
      thumbnailUrl?: string;
    },
  ) {
    return this.resourcesService.update(id, body);
  }

  /**
   * 删除资源
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.RESOURCE_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除资源',
    description: '删除教学资源',
  })
  @ApiParam({ name: 'id', description: '资源 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.resourcesService.remove(id);
    return { message: '资源删除成功' };
  }

  /**
   * 下载资源（记录下载次数并重定向到文件 URL）
   */
  @Get(':id/download')
  @RequirePermissions(Permission.RESOURCE_DOWNLOAD)
  @ApiOperation({
    summary: '下载资源',
    description: '下载教学资源，同时记录下载次数',
  })
  @ApiParam({ name: 'id', description: '资源 ID' })
  @ApiResponse({ status: 302, description: '重定向到文件下载地址' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const resource = await this.resourcesService.recordDownload(id);
    res.redirect(resource.fileUrl);
  }

  /**
   * 搜索资源
   */
  @Get('search')
  @RequirePermissions(Permission.RESOURCE_READ)
  @ApiOperation({
    summary: '搜索资源',
    description: '按关键词搜索教学资源',
  })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async search(
    @CurrentUser('institutionId') institutionId: string,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.resourcesService.search(institutionId, keyword, limit);
  }

  /**
   * 获取资源分类列表
   */
  @Get('categories')
  @RequirePermissions(Permission.RESOURCE_READ)
  @ApiOperation({
    summary: '获取资源分类',
    description: '获取当前机构的所有资源分类',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategories(@CurrentUser('institutionId') institutionId: string) {
    return this.resourcesService.getCategories(institutionId);
  }
}
