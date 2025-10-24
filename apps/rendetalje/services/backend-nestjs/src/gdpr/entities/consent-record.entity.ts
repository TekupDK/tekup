import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsentRecord {
  @ApiProperty({ example: 'clxyz123', description: 'Record ID' })
  id: string;

  @ApiProperty({ example: 'clxyz456', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'marketing_emails', description: 'Type of consent' })
  consentType: string;

  @ApiProperty({ example: true, description: 'Whether consent was granted' })
  granted: boolean;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', description: 'When consent was granted' })
  grantedAt: Date;

  @ApiPropertyOptional({ example: '2025-06-15T10:00:00Z', description: 'When consent was revoked' })
  revokedAt?: Date;

  @ApiProperty({ example: '192.168.1.1', description: 'IP address of the user' })
  ipAddress: string;

  @ApiProperty({ example: 'Mozilla/5.0...', description: 'User agent string' })
  userAgent: string;

  @ApiProperty({ example: '1.0', description: 'Privacy policy version' })
  version: string;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T10:05:00Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
