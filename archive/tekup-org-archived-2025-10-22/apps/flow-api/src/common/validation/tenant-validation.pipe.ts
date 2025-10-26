import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class TenantValidationPipe implements PipeTransform {
  private readonly logger = new Logger(TenantValidationPipe.name);

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // Only validate tenant ID parameters
    if (!value) {
      throw new BadRequestException('Tenant ID is required');
    }

    // Simple validation that the tenant ID is a non-empty string
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException('Invalid tenant ID format');
    }

    return value;
  }
}