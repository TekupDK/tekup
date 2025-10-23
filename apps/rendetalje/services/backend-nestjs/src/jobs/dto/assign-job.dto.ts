import { IsUUID, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class JobAssignmentDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Team member ID' })
  @IsUUID()
  team_member_id: string;

  @ApiProperty({ example: 'lead', description: 'Role in the job', enum: ['lead', 'cleaner', 'supervisor'] })
  @IsString()
  role: string;
}

export class AssignJobDto {
  @ApiProperty({ description: 'Team member assignments' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobAssignmentDto)
  assignments: JobAssignmentDto[];
}