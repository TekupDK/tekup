import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsObject } from 'class-validator';

export class ProcessVoiceCommandDto {
  @ApiProperty({
    description: 'Business configuration ID to use for processing',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  businessId: string;

  @ApiProperty({
    description: 'Additional context for command processing',
    example: { location: 'main-counter', user_role: 'cashier' },
    required: false
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiProperty({
    description: 'Session ID for tracking related commands',
    example: 'session_abc123',
    required: false
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'Expected command type for optimization',
    example: 'order_food',
    required: false
  })
  @IsOptional()
  @IsString()
  expectedCommandType?: string;
}