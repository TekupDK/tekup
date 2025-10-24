import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  jobsCompleted: number;
  averageJobDuration: number;
  averageQualityScore: number;
  customerSatisfaction: number;
  punctualityScore: number;
  efficiencyRating: number;
  totalHoursWorked: number;
  overtimeHours: number;
}

export class TeamMember {
  @ApiProperty({ example: 'clxxx...', description: 'Team member ID' })
  id: string;

  @ApiProperty({ example: 'clyyy...', description: 'Associated user ID' })
  userId: string;

  @ApiProperty({ example: 'EMP-2024-0001', description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ 
    description: 'Employee skills',
    example: ['standard_cleaning', 'deep_cleaning', 'window_cleaning']
  })
  skills: string[];

  @ApiPropertyOptional({ example: 250.00, description: 'Hourly rate in DKK' })
  hourlyRate?: number;

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
      jobsCompleted: 45,
      averageJobDuration: 125,
      averageQualityScore: 4.2,
      customerSatisfaction: 4.5,
      punctualityScore: 4.8,
      efficiencyRating: 4.3,
      totalHoursWorked: 160,
      overtimeHours: 8
    }
  })
  performanceMetrics: PerformanceMetrics;

  @ApiProperty({ example: true, description: 'Whether team member is active' })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Hire date' })
  hireDate?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}