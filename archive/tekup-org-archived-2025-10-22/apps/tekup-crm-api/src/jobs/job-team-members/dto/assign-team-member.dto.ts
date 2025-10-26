import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTeamMemberDto {
  @ApiProperty({
    description: 'Team member ID',
    example: 'tm-123',
  })
  @IsString()
  teamMemberId: string;

  @ApiProperty({
    description: 'Role for this specific job',
    example: 'Team Leader',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Role must be at least 2 characters long' })
  role?: string;
}
