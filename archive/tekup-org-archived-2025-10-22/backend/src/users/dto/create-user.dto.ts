import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 100,
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+45 12 34 56 78',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('DK', { message: 'Please provide a valid Danish phone number' })
  phoneNumber?: string;

  @ApiProperty({
    enum: UserRole,
    description: 'User role in the system',
    default: UserRole.CUSTOMER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Please provide a valid user role' })
  role?: UserRole;

  @ApiProperty({
    description: 'User profile image URL',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Profile image URL must be a string' })
  profileImageUrl?: string;

  @ApiProperty({
    description: 'User preferences as JSON object',
    required: false,
  })
  @IsOptional()
  preferences?: Record<string, any>;
}