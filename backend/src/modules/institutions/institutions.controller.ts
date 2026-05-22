import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 机构管理控制器
 * 处理机构信息查询、更新、Logo 上传等请求
 */
@ApiTags('institutions')
@ApiBearerAuth('access-token')
@Controller('institutions')
@UseGuards(RolesGuard, PermissionsGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  /**
   * 获取当前机构信息
   */
  @Get('current')
  @RequirePermissions(Permission.INSTITUTION_READ)
  @ApiOperation({
    summary: '获取当前机构信息',
    description: '获取当前登录用户所属机构的详细信息，包含统计数据',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '机构不存在' })
  async getCurrentInstitution(@CurrentUser('institutionId') institutionId: string) {
    return this.institutionsService.getCurrentInstitution(institutionId);
  }

  /**
   * 获取机构公开信息（无需登录）
   */
  @Get('public')
  @Public()
  @ApiOperation({
    summary: '获取机构公开信息',
    description: '公开接口，无需登录即可获取机构的基本展示信息',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '机构不存在' })
  async getPublicInstitution(@CurrentUser('institutionId') institutionId: string) {
    return this.institutionsService.getPublicInstitution(institutionId);
  }

  /**
   * 更新当前机构信息
   */
  @Put('current')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.INSTITUTION_UPDATE)
  @ApiOperation({
    summary: '更新机构信息',
    description: '更新当前机构的基本信息',
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '机构不存在' })
  async updateCurrentInstitution(
    @CurrentUser('institutionId') institutionId: string,
    @Body() dto: UpdateInstitutionDto,
  ) {
    return this.institutionsService.updateCurrentInstitution(institutionId, dto);
  }

  /**
   * 上传机构 Logo
   */
  @Post('current/logo')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.INSTITUTION_MANAGE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '上传机构 Logo',
    description: '上传并更新机构 Logo 图片',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Logo 图片文件（支持 JPG、PNG，建议尺寸 200x200）',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  @ApiResponse({ status: 400, description: '文件格式不正确' })
  async uploadLogo(
    @CurrentUser('institutionId') institutionId: string,
    @UploadedFile() file: any,
    @Body('logoUrl') logoUrl?: string,
  ) {
    // 如果直接传了 logoUrl 则使用它，否则使用上传文件的路径
    const finalLogoUrl = logoUrl || file?.path;

    if (!finalLogoUrl) {
      throw new BadRequestException('请上传 Logo 图片或提供 Logo URL');
    }

    return this.institutionsService.uploadLogo(institutionId, finalLogoUrl);
  }
}
