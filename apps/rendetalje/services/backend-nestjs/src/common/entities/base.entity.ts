import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Re-export for use in other entities
export { ApiProperty, ApiPropertyOptional };

export abstract class BaseEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Unique identifier' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update timestamp' })
  updated_at: string;
}

export abstract class OrganizationEntity extends BaseEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Organization ID' })
  organization_id: string;
}