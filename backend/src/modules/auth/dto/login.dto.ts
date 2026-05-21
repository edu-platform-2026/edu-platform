import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * 鐧诲綍璇锋眰 DTO
 * 鍖呭惈鐢ㄦ埛鍚嶅拰瀵嗙爜瀛楁
 */
export class LoginDto {
  @ApiProperty({
    description: '鐢ㄦ埛鍚?,
    example: 'admin',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: '鐢ㄦ埛鍚嶄笉鑳戒负绌? })
  @IsString({ message: '鐢ㄦ埛鍚嶅繀椤绘槸瀛楃涓? })
  @MinLength(2, { message: '鐢ㄦ埛鍚嶉暱搴︿笉鑳藉皯浜?2 涓瓧绗? })
  @MaxLength(100, { message: '鐢ㄦ埛鍚嶉暱搴︿笉鑳借秴杩?100 涓瓧绗? })
  username: string;

  @ApiProperty({
    description: '瀵嗙爜',
    example: 'password123',
    minLength: 6,
    maxLength: 50,
  })
  @IsNotEmpty({ message: '瀵嗙爜涓嶈兘涓虹┖' })
  @IsString({ message: '瀵嗙爜蹇呴』鏄瓧绗︿覆' })
  @MinLength(6, { message: '瀵嗙爜闀垮害涓嶈兘灏戜簬 6 涓瓧绗? })
  @MaxLength(50, { message: '瀵嗙爜闀垮害涓嶈兘瓒呰繃 50 涓瓧绗? })
  password: string;

  @ApiPropertyOptional({
    description: '鐧诲綍瑙掕壊锛堝彲閫夛紝鐢ㄤ簬鍓嶇瑙掕壊閫夋嫨锛?,
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString({ message: '瑙掕壊蹇呴』鏄瓧绗︿覆' })
  role?: string;
}

/**
 * 鐧诲綍鍝嶅簲鏁版嵁鎺ュ彛
 */
export class LoginResponseDto {
  @ApiProperty({ description: '璁块棶浠ょ墝' })
  accessToken: string;

  @ApiProperty({ description: '鍒锋柊浠ょ墝' })
  refreshToken: string;

  @ApiProperty({ description: '浠ょ墝绫诲瀷', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: '杩囨湡鏃堕棿锛堢锛? })
  expiresIn: number;

  @ApiProperty({ description: '鐢ㄦ埛淇℃伅' })
  user: {
    id: string;
    username: string;
    realName: string;
    roles: string[];
    institutionId: string;
  };
}

/**
 * 鍒锋柊浠ょ墝璇锋眰 DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: '鍒锋柊浠ょ墝',
    example: 'your-refresh-token-here',
  })
  @IsNotEmpty({ message: '鍒锋柊浠ょ墝涓嶈兘涓虹┖' })
  @IsString({ message: '鍒锋柊浠ょ墝蹇呴』鏄瓧绗︿覆' })
  refreshToken: string;
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
  @MinLength(6, { message: '瀵嗙爜闀垮害涓嶈兘灏戜簬 6 涓瓧绗? })
  currentPassword: string;

  @ApiProperty({
    description: '鏂板瘑鐮?,
    example: 'newPassword123',
  })
  @IsNotEmpty({ message: '鏂板瘑鐮佷笉鑳戒负绌? })
  @IsString({ message: '鏂板瘑鐮佸繀椤绘槸瀛楃涓? })
  @MinLength(6, { message: '鏂板瘑鐮侀暱搴︿笉鑳藉皯浜?6 涓瓧绗? })
  @MaxLength(50, { message: '鏂板瘑鐮侀暱搴︿笉鑳借秴杩?50 涓瓧绗? })
  newPassword: string;
}
