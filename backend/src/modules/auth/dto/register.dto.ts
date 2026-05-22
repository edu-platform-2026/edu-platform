import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

/**
 * 注册请求 DTO
 * 创建新用户时使用
 */
export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'teacher01',
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
    example: 'Password123',
    minLength: 8,
    maxLength: 50,
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于 8 个字符' })
  @MaxLength(50, { message: '密码长度不能超过 50 个字符' })
  password: string;

  @ApiProperty({
    description: '真实姓名',
    example: '张三',
    maxLength: 50,
  })
  @IsNotEmpty({ message: '真实姓名不能为空' })
  @IsString({ message: '真实姓名必须是字符串' })
  @MaxLength(50, { message: '真实姓名长度不能超过 50 个字符' })
  realName: string;

  @ApiPropertyOptional({
    description: '手机号码',
    example: '13800138000',
  })
  @IsOptional()
  @IsString({ message: '手机号码必须是字符串' })
  phone?: string;

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'teacher@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({
    description: '性别（0-未知, 1-男, 2-女）',
    example: 1,
    enum: [0, 1, 2],
  })
  @IsOptional()
  gender?: number;

  @ApiPropertyOptional({
    description: '所属机构 ID（不传则使用默认机构）',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString({ message: '机构 ID 必须是字符串' })
  institutionId?: string;

  @ApiPropertyOptional({
    description: '用户角色',
    enum: Role,
    example: Role.STUDENT,
  })
  @IsOptional()
  @IsEnum(Role, { message: '角色类型不正确' })
  role?: Role;

  @ApiPropertyOptional({
    description: '邀请码（可选，使用邀请码注册时传入）',
    example: 'A1B2C3D4',
  })
  @IsOptional()
  @IsString({ message: '邀请码必须是字符串' })
  invitationCode?: string;
}

/**
 * 修改密码 DTO
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: 'OldPassword123',
  })
  @IsNotEmpty({ message: '当前密码不能为空' })
  @IsString({ message: '当前密码必须是字符串' })
  oldPassword: string;

  @ApiProperty({
    description: '新密码',
    example: 'NewPassword123',
    minLength: 8,
    maxLength: 50,
  })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码长度不能少于 8 个字符' })
  @MaxLength(50, { message: '新密码长度不能超过 50 个字符' })
  newPassword: string;
}

/**
 * 刷新令牌 DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'refresh-token-string',
  })
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  @IsString({ message: '刷新令牌必须是字符串' })
  refreshToken: string;
}
