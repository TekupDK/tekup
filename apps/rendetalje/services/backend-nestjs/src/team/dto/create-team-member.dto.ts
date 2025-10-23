import { IsUUID, IsString, IsOptional, IsArray, IsNumber, Min, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeeklyAvailability } from '../entities/team-member.entity';

export class CreateTeamMemberDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Associated user ID' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ example: 'EMP-2024-0001', description: 'Employee ID (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  employee_id?: string;

  @ApiProperty({ 
    description: 'Employee skills',
    example: ['standard_cleaning', 'deep_cleaning', 'window_cleaning']
  })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiPropertyOptional({ example: 250.00, description: 'Hourly rate in DKK' })
  @IsOptional()
  @IsNumber()
  @Min(0)
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
  @IsObject()
  availability: WeeklyAvailability;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Hire date' })
  @IsOptional()
  @IsDateString()
  hire_date?: string;
}