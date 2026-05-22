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

export class RegisterDto {
  @ApiProperty({ description: 'Username', example: 'student01', minLength: 2, maxLength: 100 })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  username: string;

  @ApiProperty({ description: 'Password', example: 'password123', minLength: 8, maxLength: 50 })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50)
  password: string;

  @ApiProperty({ description: 'Real name', example: 'Zhang San', maxLength: 50 })
  @IsNotEmpty({ message: 'Real name is required' })
  @IsString()
  @MaxLength(50)
  realName: string;

  @ApiPropertyOptional({ description: 'Phone', example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email', example: 'student@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({ description: 'Gender (0-unknown, 1-male, 2-female)', enum: [0, 1, 2] })
  @IsOptional()
  gender?: number;

  @ApiPropertyOptional({ description: 'Institution ID' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'User role', enum: Role })
  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role' })
  role?: Role;

  @ApiPropertyOptional({ description: 'Invitation code (optional)', example: 'A1B2C3D4' })
  @IsOptional()
  @IsString()
  invitationCode?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: 'New password', minLength: 8, maxLength: 50 })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString()
  refreshToken: string;
}
