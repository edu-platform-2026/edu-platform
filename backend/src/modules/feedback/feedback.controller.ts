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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Role } from '../../common/enums/role.enum';
import { Permission } from '../../common/enums/permission.enum';

/**
 * 鍙嶉绠＄悊鎺у埗鍣? * 澶勭悊鍙嶉 CRUD銆佸洖澶嶇瓑璇锋眰
 */
@ApiTags('feedback')
@ApiBearerAuth('access-token')
@Controller('feedback')
@UseGuards(RolesGuard, PermissionsGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * 鑾峰彇鍙嶉鍒楄〃
   */
  @Get()
  @RequirePermissions(Permission.FEEDBACK_READ)
  @ApiOperation({
    summary: '鑾峰彇鍙嶉鍒楄〃',
    description: '鍒嗛〉鑾峰彇鍙嶉鍒楄〃锛屾敮鎸佹寜鍏抽敭璇嶃€佺被鍨嬨€佺姸鎬佺瓫閫?,
  })
  @ApiResponse({ status: 200, description: '鑾峰彇鎴愬姛' })
  async findAll(
    @CurrentUser('institutionId') institutionId: string,
    @Query() paginationDto: PaginationDto,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('status') status?: number,
    @Query('parentId') parentId?: string,
  ) {
    return this.feedbackService.findAll(institutionId, paginationDto, {
      keyword,
      category,
      status,
      parentId,
    });
  }

  /**
   * 鑾峰彇鎴戠殑鍙嶉
   */
  @Get('my')
  @RequirePermissions(Permission.FEEDBACK_READ)
  @ApiOperation({
    summary: '鑾峰彇鎴戠殑鍙嶉',
    description: '鑾峰彇褰撳墠鐢ㄦ埛鎻愪氦鐨勬墍鏈夊弽棣?,
  })
  @ApiResponse({ status: 200, description: '鑾峰彇鎴愬姛' })
  async findMyFeedbacks(
    @CurrentUser('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.feedbackService.findMyFeedbacks(userId, paginationDto);
  }

  /**
   * 鑾峰彇鍙嶉璇︽儏
   */
  @Get(':id')
  @RequirePermissions(Permission.FEEDBACK_READ)
  @ApiOperation({
    summary: '鑾峰彇鍙嶉璇︽儏',
    description: '鏍规嵁 ID 鑾峰彇鍙嶉璇︾粏淇℃伅锛屽寘鍚墍鏈夊洖澶?,
  })
  @ApiParam({ name: 'id', description: '鍙嶉 ID' })
  @ApiResponse({ status: 200, description: '鑾峰彇鎴愬姛' })
  @ApiResponse({ status: 404, description: '鍙嶉涓嶅瓨鍦? })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedbackService.findById(id);
  }

  /**
   * 鍒涘缓鍙嶉
   */
  @Post()
  @RequirePermissions(Permission.FEEDBACK_CREATE)
  @ApiOperation({
    summary: '鎻愪氦鍙嶉',
    description: '鎻愪氦鏂扮殑鍙嶉',
  })
  @ApiResponse({ status: 201, description: '鎻愪氦鎴愬姛' })
  async create(
    @CurrentUser('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(institutionId, userId, dto);
  }

  /**
   * 鏇存柊鍙嶉
   */
  @Put(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.FEEDBACK_UPDATE)
  @ApiOperation({
    summary: '鏇存柊鍙嶉',
    description: '鏇存柊鍙嶉淇℃伅鎴栫姸鎬?,
  })
  @ApiParam({ name: 'id', description: '鍙嶉 ID' })
  @ApiResponse({ status: 200, description: '鏇存柊鎴愬姛' })
  @ApiResponse({ status: 404, description: '鍙嶉涓嶅瓨鍦? })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      category?: string;
      status?: number;
    },
  ) {
    return this.feedbackService.update(id, body);
  }

  /**
   * 鍒犻櫎鍙嶉
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.FEEDBACK_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '鍒犻櫎鍙嶉',
    description: '鍒犻櫎鍙嶉',
  })
  @ApiParam({ name: 'id', description: '鍙嶉 ID' })
  @ApiResponse({ status: 200, description: '鍒犻櫎鎴愬姛' })
  @ApiResponse({ status: 404, description: '鍙嶉涓嶅瓨鍦? })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.feedbackService.remove(id);
    return { message: '鍙嶉鍒犻櫎鎴愬姛' };
  }

  /**
   * 鍥炲鍙嶉
   */
  @Post(':id/reply')
  @Roles(Role.ADMIN, Role.TEACHER)
  @RequirePermissions(Permission.FEEDBACK_REPLY)
  @ApiOperation({
    summary: '鍥炲鍙嶉',
    description: '鍥炲鐢ㄦ埛鐨勫弽棣堬紝鍙悓鏃舵洿鏂板弽棣堢姸鎬?,
  })
  @ApiParam({ name: 'id', description: '鍙嶉 ID' })
  @ApiResponse({ status: 201, description: '鍥炲鎴愬姛' })
  @ApiResponse({ status: 404, description: '鍙嶉涓嶅瓨鍦? })
  async reply(
    @Param('id', ParseUUIDPipe) feedbackId: string,
    @CurrentUser('id') replierId: string,
    @Body() dto: ReplyFeedbackDto,
  ) {
    return this.feedbackService.reply(feedbackId, replierId, dto);
  }
}