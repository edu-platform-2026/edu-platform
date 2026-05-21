import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, ChangePasswordDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * 璁よ瘉鎺у埗鍣? * 澶勭悊鐢ㄦ埛璁よ瘉鐩稿叧鐨?HTTP 璇锋眰
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 鐢ㄦ埛鐧诲綍
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '鐢ㄦ埛鐧诲綍',
    description: '浣跨敤鐢ㄦ埛鍚嶅拰瀵嗙爜杩涜鐧诲綍锛岃繑鍥?JWT 浠ょ墝',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '鐧诲綍鎴愬姛',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '鐢ㄦ埛鍚嶆垨瀵嗙爜閿欒' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  /**
   * 鐢ㄦ埛娉ㄥ唽
   */
  @Public()
  @Post('register')
  @ApiOperation({
    summary: '鐢ㄦ埛娉ㄥ唽',
    description: '鍒涘缓鏂扮敤鎴疯处鍙?,
  })
  @ApiResponse({ status: 201, description: '娉ㄥ唽鎴愬姛' })
  @ApiResponse({ status: 409, description: '鐢ㄦ埛鍚嶆垨鎵嬫満鍙峰凡瀛樺湪' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * 鍒锋柊浠ょ墝
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '鍒锋柊浠ょ墝',
    description: '浣跨敤鍒锋柊浠ょ墝鑾峰彇鏂扮殑璁块棶浠ょ墝',
  })
  @ApiResponse({ status: 200, description: '浠ょ墝鍒锋柊鎴愬姛' })
  @ApiResponse({ status: 401, description: '鍒锋柊浠ょ墝鏃犳晥鎴栧凡杩囨湡' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * 鑾峰彇褰撳墠鐢ㄦ埛淇℃伅
   */
  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '鑾峰彇涓汉淇℃伅',
    description: '鑾峰彇褰撳墠鐧诲綍鐢ㄦ埛鐨勮缁嗕俊鎭?,
  })
  @ApiResponse({ status: 200, description: '鑾峰彇鎴愬姛' })
  @ApiResponse({ status: 401, description: '鏈璇? })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  /**
   * 鏇存柊涓汉淇℃伅
   */
  @Put('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '鏇存柊涓汉淇℃伅',
    description: '鏇存柊褰撳墠鐧诲綍鐢ㄦ埛鐨勫熀鏈俊鎭?,
  })
  @ApiResponse({ status: 200, description: '鏇存柊鎴愬姛' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateData: { realName?: string; email?: string; phone?: string; avatarUrl?: string },
  ) {
    return this.authService.updateProfile(userId, updateData);
  }

  /**
   * 淇敼瀵嗙爜
   */
  @Put('password')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '淇敼瀵嗙爜',
    description: '淇敼褰撳墠鐧诲綍鐢ㄦ埛鐨勫瘑鐮?,
  })
  @ApiResponse({ status: 200, description: '瀵嗙爜淇敼鎴愬姛' })
  @ApiResponse({ status: 401, description: '褰撳墠瀵嗙爜涓嶆纭? })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}
