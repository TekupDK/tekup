import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

export class JobAssignment extends BaseEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' })
  job_id: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Team member ID' })
  team_member_id: string;

  @ApiProperty({ example: 'lead', description: 'Role in the job', enum: ['lead', 'cleaner', 'supervisor'] })
  role: string;

  @ApiProperty({ example: '2024-01-01T08:00:00.000Z', description: 'Assignment timestamp' })
  assigned_at: string;
}