import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface CompletedChecklistItem {
  id: string;
  completed: boolean;
  photo_urls: string[];
  notes?: string;
  points_earned?: number;
  completion_time?: string;
}

export class JobQualityAssessment {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Assessment ID' })
  id: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Job/Lead ID' })
  job_id: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000003', description: 'Quality checklist ID' })
  checklist_id: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000004', description: 'User who performed assessment' })
  assessed_by: string;

  @ApiProperty({
    description: 'Completed checklist items with photos and notes',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        completed: { type: 'boolean' },
        photo_urls: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
        points_earned: { type: 'number' },
        completion_time: { type: 'string' },
      },
    },
  })
  completed_items: CompletedChecklistItem[];

  @ApiProperty({ example: 4, description: 'Overall quality score (1-5)', minimum: 1, maximum: 5 })
  overall_score: number;

  @ApiProperty({ example: 85, description: 'Percentage score based on completed items' })
  percentage_score: number;

  @ApiProperty({ example: 42, description: 'Total points earned' })
  total_points_earned: number;

  @ApiProperty({ example: 50, description: 'Maximum possible points' })
  max_possible_points: number;

  @ApiPropertyOptional({ example: 'Excellent work, all areas cleaned thoroughly', description: 'Assessment notes' })
  notes?: string;

  @ApiProperty({ example: 'completed', description: 'Assessment status', enum: ['in_progress', 'completed', 'reviewed'] })
  status: 'in_progress' | 'completed' | 'reviewed';

  @ApiProperty({ example: '2024-01-15T10:00:00Z', description: 'Created timestamp' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', description: 'Updated timestamp' })
  updated_at: Date;
}
