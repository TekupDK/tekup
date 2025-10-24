import { IsUUID, IsEnum, IsString, IsOptional, IsArray, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' })
  @IsUUID()
  customer_id: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000003', description: 'Related job ID' })
  @IsOptional()
  @IsUUID()
  job_id?: string;

  @ApiProperty({ example: 'employee', description: 'Type of sender', enum: ['customer', 'employee', 'system'] })
  @IsEnum(['customer', 'employee', 'system'])
  sender_type: 'customer' | 'employee' | 'system';

  @ApiProperty({ example: 'text', description: 'Type of message', enum: ['text', 'photo', 'file'] })
  @IsEnum(['text', 'photo', 'file'])
  message_type: 'text' | 'photo' | 'file';

  @ApiProperty({ example: 'Hej, hvornår kommer I i dag?', description: 'Message content' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ 
    description: 'Message attachments',
    example: ['https://example.com/photo1.jpg', 'https://example.com/document.pdf']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}