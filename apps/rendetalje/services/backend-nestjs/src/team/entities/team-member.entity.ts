import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationEntity } from '../../common/entities/base.entity';

export interface WeeklyAvailability {
  monday?: { start: string; end: string; available: boolean };
  tuesday?: { start: string; end: string; available: boolean };
  wednesday?: { start: string; end: string; available: boolean };
  thursday?: { start: string; end: string; available: boolean };
  friday?: { start: string; end: string; available: boolean };
  saturday?: { start: string; end: string; available: boolean };
  sunday?: { start: string; end: string; available: boolean };
}

export interface PerformanceMetrics {
  jobs_completed: number;
  average_job_duration: number;
  average_quality_score: number;
  customer_satisfaction: number;
  punctuality_score: number;
  efficiency_rating: number;
  total_hours_worked: number;
  overtime_hours: number;
}

export class TeamMember extends OrganizationEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Associated user ID' })
  user_id: string;

  @ApiProperty({ example: 'EMP-2024-0001', description: 'Employee ID' })
  employee_id: string;

  @ApiProperty({ 
    description: 'Employee skills',
    example: ['standard_cleaning', 'deep_cleaning', 'window_cleaning']
  })
  skills: string[];

  @ApiPropertyOptional({ example: 250.00, description: 'Hourly rate in DKK' })
  hourly_rate?: number;

  @ApiProperty({ 
    description: 'Weekly availability schedule',
    example: {
      monday: { start: '08:00', end: '16:00', available: true },
      tuesday: { start: '08:00', end: '16:00', available: true },
      wednesday: { start: '08:00', end: '16:00', available: true },
      thursday: { start: '08:00', end: '16:00', available: true },
      friday: { start: '08:00', end: '16:00', available: true },
      saturday: { start: '09:00', end: '14:00', available: false },
      sunday: { start: '09:00', end: '14:00', available: false }
    }
  })
  availability: WeeklyAvailability;

  @ApiProperty({ 
    description: 'Performance metrics',
    example: {
      jobs_completed: 45,
      average_job_duration: 125,
      average_quality_score: 4.2,
      customer_satisfaction: 4.5,
      punctuality_score: 4.8,
      efficiency_rating: 4.3,
      total_hours_worked: 160,
      overtime_hours: 8
    }
  })
  performance_metrics: PerformanceMetrics;

  @ApiProperty({ example: true, description: 'Whether team member is active' })
  is_active: boolean;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Hire date' })
  hire_date?: string;
}