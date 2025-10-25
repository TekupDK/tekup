import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RequestDataDeletionDto {
  @ApiPropertyOptional({ example: 'User requested account closure', description: 'Reason for deletion' })
  @IsOptional()
  @IsString()
  reason?: string;
}
