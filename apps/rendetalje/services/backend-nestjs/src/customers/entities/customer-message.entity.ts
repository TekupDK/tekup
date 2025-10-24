import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationEntity } from '../../common/entities/base.entity';

export class CustomerMessage extends OrganizationEntity {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' })
  customer_id: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000003', description: 'Related job ID' })
  job_id?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000004', description: 'Sender user ID' })
  sender_id?: string;

  @ApiProperty({ example: 'employee', description: 'Type of sender', enum: ['customer', 'employee', 'system'] })
  sender_type: 'customer' | 'employee' | 'system';

  @ApiProperty({ example: 'text', description: 'Type of message', enum: ['text', 'photo', 'file'] })
  message_type: 'text' | 'photo' | 'file';

  @ApiProperty({ example: 'Hej, hvornår kommer I i dag?', description: 'Message content' })
  content: string;

  @ApiProperty({ 
    description: 'Message attachments',
    example: ['https://example.com/photo1.jpg', 'https://example.com/document.pdf']
  })
  attachments: string[];

  @ApiProperty({ example: false, description: 'Whether message has been read' })
  is_read: boolean;
}