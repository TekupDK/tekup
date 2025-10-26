import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PhotoType } from '@prisma/client';

export class CreateJobPhotoDto {
  @ApiProperty({
    description: 'Photo URL',
    example: 'https://example.com/photos/job-123-before.jpg',
  })
  @IsString()
  @MinLength(10, { message: 'URL must be at least 10 characters long' })
  url: string;

  @ApiProperty({
    description: 'Photo caption',
    example: 'Before cleaning - kitchen area',
    required: false,
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({
    description: 'Photo type',
    enum: PhotoType,
    example: PhotoType.BEFORE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PhotoType, { message: 'Please provide a valid photo type' })
  type?: PhotoType;

  @ApiProperty({
    description: 'User who uploaded the photo',
    example: 'user-123',
  })
  @IsString()
  uploadedBy: string;
}
