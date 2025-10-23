import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-from-email', description: 'Password reset token' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewSecurePassword123!', description: 'New password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;
}