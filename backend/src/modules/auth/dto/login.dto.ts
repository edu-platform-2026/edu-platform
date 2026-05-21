import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * 登录请求 DTO
 * 包含用户名和密码字段
 */
export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(2, { message: '用户名长度不能少于 2 个字符' })
  @MaxLength(100, { message: '用户名长度不能超过 100 个字符' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
    maxLength: 50,
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于 6 个字符' })
  @MaxLength(50, { message: '密码长度不能超过 50 个字符' })
  password: string;
}

/**
 * 登录响应数据接口
 */
export class LoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;

  @ApiProperty({ description: '令牌类型', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: '过期时间（秒）' })
  expiresIn: number;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: string;
    username: string;
    realName: string;
    roles: string[];
    institutionId: string;
  };
}

/**
 * 淇敼瀵嗙爜璇锋眰 DTO
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: '褰撳墠瀵嗙爜',
    example: 'oldPassword123',
  })
  @IsNotEmpty({ message: '褰撳墠瀵嗙爜涓嶈兘涓虹┖' })
  @IsString({ message: '褰撳墠瀵嗙爜蹇呴』鏄瓧绗︿覆' })
  oldPassword: string;

  @ApiProperty({
    description: '鏂板瘑鐮?,
    example: 'newPassword123',
    minLength: 6,
    maxLength: 50,
  })
  @IsNotEmpty({ message: '鏂板瘑鐮佷笉鑳戒负绌? })
  @IsString({ message: '鏂板瘑鐮佸繀椤绘槸瀛楃涓? })
  @MinLength(6, { message: '鏂板瘑鐮侀暱搴︿笉鑳藉皯浜?6 涓瓧绗? })
  @MaxLength(50, { message: '鏂板瘑鐮侀暱搴︿笉鑳借秴杩?50 涓瓧绗? })
  newPassword: string;
}

/**
 * 鍒锋柊浠ょ墝璇锋眰 DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: '鍒锋柊浠ょ墝',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: '鍒锋柊浠ょ墝涓嶈兘涓虹┖' })
  @IsString({ message: '鍒锋柊浠ょ墝蹇呴』鏄瓧绗︿覆' })
  refreshToken: string;
}