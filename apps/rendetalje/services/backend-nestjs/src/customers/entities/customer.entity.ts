import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Customer {
  @ApiProperty({ example: 'ckl1234567890', description: 'Customer ID' })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  name: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Customer email address' })
  email?: string;

  @ApiPropertyOptional({ example: '+45 12 34 56 78', description: 'Customer phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Hovedgade 123, 1000 København', description: 'Customer address' })
  address?: string;

  @ApiPropertyOptional({ example: 'Acme Corporation', description: 'Company name if B2B' })
  companyName?: string;

  @ApiPropertyOptional({ example: 'VIP customer, always pays on time', description: 'Internal notes about customer' })
  notes?: string;

  @ApiProperty({ example: 'active', description: 'Customer status' })
  status: string;

  @ApiProperty({ example: ['vip', 'recurring'], description: 'Customer tags' })
  tags: string[];

  @ApiProperty({ example: 15, description: 'Total number of leads' })
  totalLeads: number;

  @ApiProperty({ example: 10, description: 'Total number of bookings' })
  totalBookings: number;

  @ApiProperty({ example: 18500.50, description: 'Total revenue from customer' })
  totalRevenue: number;

  @ApiPropertyOptional({ description: 'Last contact timestamp' })
  lastContactAt?: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}