import { IsString, IsUUID, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskAssignmentStatus {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateTaskAssignmentDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'Job (booking) ID to assign' 
  })
  @IsUUID()
  jobId: string;

  @ApiProperty({ 
    example: '789e4567-e89b-12d3-a456-426614174111', 
    description: 'Subcontractor ID to assign to' 
  })
  @IsUUID()
  subcontractorId: string;

  @ApiPropertyOptional({ 
    example: 'Customer requested this specific subcontractor', 
    description: 'Assignment notes' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateTaskAssignmentDto {
  @ApiPropertyOptional({ 
    example: TaskAssignmentStatus.ACCEPTED, 
    description: 'Assignment status',
    enum: TaskAssignmentStatus
  })
  @IsOptional()
  @IsEnum(TaskAssignmentStatus)
  status?: TaskAssignmentStatus;

  @ApiPropertyOptional({ 
    example: 'Work completed successfully', 
    description: 'Completion or cancellation notes' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AssignTaskDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'Job ID' 
  })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Use smart algorithm to select best subcontractor' 
  })
  @IsOptional()
  useSmartAssignment?: boolean;

  @ApiPropertyOptional({ 
    example: '789e4567-e89b-12d3-a456-426614174111', 
    description: 'Manually specify subcontractor (overrides smart assignment)' 
  })
  @IsOptional()
  @IsUUID()
  subcontractorId?: string;
}
