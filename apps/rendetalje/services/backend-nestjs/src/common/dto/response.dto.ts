import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuccessResponseDto<T = any> {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ example: 'Operation completed successfully', description: 'Success message' })
  message?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Response timestamp' })
  timestamp?: string;

  constructor(data?: T, message?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}

export class ErrorResponseDto {
  @ApiProperty({ example: false, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Bad Request', description: 'Error type' })
  error: string;

  @ApiProperty({ example: 'Validation failed', description: 'Error message' })
  message: string;

  @ApiPropertyOptional({ example: ['field is required'], description: 'Detailed error messages' })
  details?: string[];

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/jobs', description: 'Request path' })
  path: string;

  constructor(error: string, message: string, statusCode: number, path: string, details?: string[]) {
    this.success = false;
    this.error = error;
    this.message = message;
    this.details = details;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}