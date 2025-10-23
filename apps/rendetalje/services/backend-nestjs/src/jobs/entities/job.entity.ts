import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationEntity } from '../../common/entities/base.entity';

export enum ServiceType {
  STANDARD = 'standard',
  DEEP = 'deep',
  WINDOW = 'window',
  MOVEOUT = 'moveout',
  OFFICE = 'office',
}

export enum JobStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

export interface Address {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  photo_required: boolean;
  photo_url?: string;
  notes?: string;
}

export interface JobPhoto {
  id: string;
  url: string;
  type: 'before' | 'after' | 'during' | 'issue';
  caption?: string;
  uploaded_at: string;
}

export interface Profitability {
  total_price: number;
  labor_cost: number;
  material_cost: number;
  travel_cost: number;
  profit_margin: number;
}

export class Job extends OrganizationEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' })
  customer_id: string;

  @ApiProperty({ example: 'JOB-2024-001-0001', description: 'Human-readable job number' })
  job_number: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.STANDARD, description: 'Type of service' })
  service_type: ServiceType;

  @ApiProperty({ enum: JobStatus, example: JobStatus.SCHEDULED, description: 'Current job status' })
  status: JobStatus;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z', description: 'Scheduled date and time' })
  scheduled_date: string;

  @ApiProperty({ example: 120, description: 'Estimated duration in minutes' })
  estimated_duration: number;

  @ApiPropertyOptional({ example: 135, description: 'Actual duration in minutes' })
  actual_duration?: number;

  @ApiProperty({ 
    description: 'Job location address',
    example: {
      street: 'Hovedgade 123',
      city: 'København',
      postal_code: '1000',
      country: 'Denmark',
      coordinates: { lat: 55.6761, lng: 12.5683 }
    }
  })
  location: Address;

  @ApiPropertyOptional({ example: 'Ring på før ankomst', description: 'Special instructions' })
  special_instructions?: string;

  @ApiProperty({ 
    description: 'Job checklist items',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        completed: { type: 'boolean' },
        photo_required: { type: 'boolean' },
        photo_url: { type: 'string' },
        notes: { type: 'string' }
      }
    }
  })
  checklist: ChecklistItem[];

  @ApiProperty({ 
    description: 'Job photos',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' },
        type: { type: 'string', enum: ['before', 'after', 'during', 'issue'] },
        caption: { type: 'string' },
        uploaded_at: { type: 'string' }
      }
    }
  })
  photos: JobPhoto[];

  @ApiPropertyOptional({ example: 'base64-encoded-signature', description: 'Customer signature' })
  customer_signature?: string;

  @ApiPropertyOptional({ example: 4, description: 'Quality score (1-5)' })
  quality_score?: number;

  @ApiPropertyOptional({ 
    description: 'Profitability breakdown',
    example: {
      total_price: 1200,
      labor_cost: 600,
      material_cost: 100,
      travel_cost: 50,
      profit_margin: 450
    }
  })
  profitability?: Profitability;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000003', description: 'Recurring job template ID' })
  recurring_job_id?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000004', description: 'Parent job ID (for rescheduled jobs)' })
  parent_job_id?: string;

  @ApiPropertyOptional({ example: 'INV-2024-001', description: 'Billy.dk invoice ID' })
  invoice_id?: string;
}