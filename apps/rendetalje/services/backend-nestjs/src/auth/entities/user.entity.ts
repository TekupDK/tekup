import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  CLIENT = 'client',
}

export class User {
  @ApiProperty({ example: 'clw123abc', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  name: string;

  @ApiPropertyOptional({ example: '+4512345678', description: 'Phone number' })
  phone?: string;

  @ApiProperty({ example: 'hashed_password', description: 'Hashed password' })
  passwordHash: string;

  @ApiProperty({ enum: UserRole, example: UserRole.EMPLOYEE, description: 'User role' })
  role: UserRole;

  @ApiProperty({ example: true, description: 'Whether account is active' })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2024-01-10T10:00:00Z', description: 'Last login timestamp' })
  lastLoginAt?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-05T10:30:00Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
