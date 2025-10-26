import { IsEmail, IsString, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'cleaner@rengoeringsfirmaet.dk',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Anna Larsen',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CLEANER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Please provide a valid user role' })
  role?: UserRole;

  @ApiProperty({
    description: 'User phone number',
    example: '+45 31 87 65 43',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
