import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'cleaner@rengoeringsfirmaet.dk',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Anna Larsen',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'tenant-123',
  })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CLEANER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Please provide a valid user role' })
  role?: UserRole;
}
