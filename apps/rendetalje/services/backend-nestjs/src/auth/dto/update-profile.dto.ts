import { IsString, IsOptional, MinLength, MaxLength, IsPhoneNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ 
    example: 'John Doe', 
    description: 'Full name of the user',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ 
    example: '+45 12 34 56 78', 
    description: 'Phone number',
    required: false 
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({ 
    example: 'https://example.com/avatar.jpg', 
    description: 'Avatar URL',
    required: false 
  })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiProperty({ 
    example: { notifications: { email: true, sms: false } }, 
    description: 'User settings object',
    required: false 
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}