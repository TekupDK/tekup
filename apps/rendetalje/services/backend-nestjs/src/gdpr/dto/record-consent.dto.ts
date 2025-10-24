import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordConsentDto {
  @ApiProperty({ example: 'marketing_emails', description: 'Type of consent' })
  @IsString()
  consentType: string;

  @ApiProperty({ example: true, description: 'Whether consent is granted' })
  @IsBoolean()
  granted: boolean;

  @ApiPropertyOptional({ example: '1.0', description: 'Privacy policy version' })
  @IsOptional()
  @IsString()
  version?: string;
}
