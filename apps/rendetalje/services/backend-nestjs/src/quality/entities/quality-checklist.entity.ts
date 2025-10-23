import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationEntity } from '../../common/entities/base.entity';
import { ServiceType } from '../../jobs/entities/job.entity';

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  photo_required: boolean;
  order: number;
  category?: string;
  points?: number;
}

export class QualityChecklist extends OrganizationEntity {
  @ApiProperty({ enum: ServiceType, example: ServiceType.STANDARD, description: 'Service type this checklist applies to' })
  service_type: ServiceType;

  @ApiProperty({ example: 'Standard Cleaning Checklist', description: 'Checklist name' })
  name: string;

  @ApiPropertyOptional({ example: 'Comprehensive checklist for standard cleaning services', description: 'Checklist description' })
  description?: string;

  @ApiProperty({ 
    description: 'Checklist items',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        required: { type: 'boolean' },
        photo_required: { type: 'boolean' },
        order: { type: 'number' },
        category: { type: 'string' },
        points: { type: 'number' }
      }
    }
  })
  items: ChecklistItem[];

  @ApiProperty({ example: true, description: 'Whether checklist is active' })
  is_active: boolean;

  @ApiProperty({ example: 1, description: 'Checklist version number' })
  version: number;
}