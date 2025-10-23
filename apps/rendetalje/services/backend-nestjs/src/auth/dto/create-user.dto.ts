import { IsEmail, IsString, IsEnum, IsUUID, IsOptional, MinLength, MaxLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: UserRole.EMPLOYEE, 
    description: 'User role in the organization' 
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ 
    example: '00000000-0000-0000-0000-000000000001', 
    description: 'Organization ID the user belongs to' 
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ 
    example: '+45 12 34 56 78', 
    description: 'Phone number (optional)',
    required: false 
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}