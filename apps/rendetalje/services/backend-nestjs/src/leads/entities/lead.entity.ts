import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class Lead {
  @ApiProperty({ example: 'clw123abc', description: 'Lead ID' })
  id: string;

  @ApiPropertyOptional({ example: 'ses_123abc', description: 'Chat session ID' })
  sessionId?: string;

  @ApiPropertyOptional({ example: 'cus_123abc', description: 'Customer ID if converted' })
  customerId?: string;

  @ApiPropertyOptional({ example: 'website', description: 'Lead source' })
  source?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Lead name' })
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  email?: string;

  @ApiPropertyOptional({ example: '+4512345678', description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Hovedgade 123, 1000 København', description: 'Address' })
  address?: string;

  @ApiPropertyOptional({ example: 85.5, description: 'Square meters to clean' })
  squareMeters?: number;

  @ApiPropertyOptional({ example: 3, description: 'Number of rooms' })
  rooms?: number;

  @ApiPropertyOptional({ example: 'standard', description: 'Type of cleaning task' })
  taskType?: string;

  @ApiProperty({ 
    description: 'Preferred dates for service', 
    type: [String], 
    example: ['2024-01-15', '2024-01-16'] 
  })
  preferredDates: string[];

  @ApiProperty({ enum: LeadStatus, example: LeadStatus.NEW, description: 'Lead status' })
  status: LeadStatus;

  @ApiPropertyOptional({ example: 'thread_abc123', description: 'Email thread ID' })
  emailThreadId?: string;

  @ApiProperty({ example: 0, description: 'Number of follow-up attempts' })
  followUpAttempts: number;

  @ApiPropertyOptional({ example: '2024-01-10T10:00:00Z', description: 'Last follow-up date' })
  lastFollowUpDate?: Date;

  @ApiPropertyOptional({ example: 'idempotency_key_123', description: 'Idempotency key for deduplication' })
  idempotencyKey?: string;

  // Firecrawl Enrichment
  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Company name from enrichment' })
  companyName?: string;

  @ApiPropertyOptional({ example: 'Technology', description: 'Industry sector' })
  industry?: string;

  @ApiPropertyOptional({ example: '11-50 employees', description: 'Estimated company size' })
  estimatedSize?: string;

  @ApiPropertyOptional({ example: 5000, description: 'Estimated lead value in DKK' })
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'Enrichment data from Firecrawl' })
  enrichmentData?: Record<string, any>;

  @ApiPropertyOptional({ example: '2024-01-05T12:00:00Z', description: 'Last enrichment timestamp' })
  lastEnriched?: Date;

  // Lead Scoring
  @ApiProperty({ example: 75, description: 'Lead score (0-100)' })
  score: number;

  @ApiProperty({ enum: LeadPriority, example: LeadPriority.MEDIUM, description: 'Lead priority' })
  priority: LeadPriority;

  @ApiPropertyOptional({ example: '2024-01-06T09:00:00Z', description: 'Last scoring timestamp' })
  lastScored?: Date;

  @ApiPropertyOptional({ description: 'Metadata used for scoring calculation' })
  scoreMetadata?: Record<string, any>;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-05T10:30:00Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
