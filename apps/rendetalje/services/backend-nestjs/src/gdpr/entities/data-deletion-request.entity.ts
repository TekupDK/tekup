import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DataDeletionRequest {
  @ApiProperty({ example: 'clxyz123', description: 'Request ID' })
  id: string;

  @ApiProperty({ example: 'clxyz456', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', description: 'Request date' })
  requestDate: Date;

  @ApiProperty({ example: '2025-02-15T10:00:00Z', description: 'Scheduled deletion date (30-day grace period)' })
  scheduledDeletionDate: Date;

  @ApiProperty({ example: 'pending', enum: ['pending', 'processing', 'completed', 'cancelled'], description: 'Request status' })
  status: string;

  @ApiPropertyOptional({ example: 'User requested account closure', description: 'Reason for deletion' })
  reason?: string;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T10:05:00Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
