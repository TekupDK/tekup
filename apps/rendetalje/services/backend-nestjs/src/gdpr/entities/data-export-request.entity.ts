import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DataExportRequest {
  @ApiProperty({ example: 'clxyz123', description: 'Request ID' })
  id: string;

  @ApiProperty({ example: 'clxyz456', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', description: 'Request date' })
  requestDate: Date;

  @ApiProperty({ example: 'pending', enum: ['pending', 'processing', 'completed', 'failed'], description: 'Request status' })
  status: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/exports/xyz.json', description: 'Download URL' })
  downloadUrl?: string;

  @ApiPropertyOptional({ example: '2025-02-15T10:00:00Z', description: 'URL expiration date' })
  expiresAt?: Date;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T10:05:00Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
