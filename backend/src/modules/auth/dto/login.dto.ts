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
