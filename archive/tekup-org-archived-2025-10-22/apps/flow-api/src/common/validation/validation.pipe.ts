import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InputValidationService, ValidationResult } from './input-validation.service.js';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';

export interface ValidationPipeOptions {
  schemaName?: string;
  strict?: boolean;
  sanitize?: boolean;
  allowUnknown?: boolean;
  transform?: boolean;
}

@Injectable()
export class ValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ValidationPipe.name);

  constructor(
    private readonly inputValidationService: InputValidationService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly options: ValidationPipeOptions = {}
  ) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // Skip validation for certain parameter types
    if (metadata.type !== 'body' && metadata.type !== 'query') {
      return value;
    }

    // Determine schema name
    const schemaName = this.options.schemaName || this.getSchemaFromMetadata(metadata);
    
    if (!schemaName) {
      this.logger.debug(`No schema found for ${metadata.type}, skipping validation`);
      return value;
    }

    try {
      const validationResult = await this.inputValidationService.validateAndSanitize(
        schemaName,
        value,
        {
          strict: this.options.strict,
          sanitize: this.options.sanitize,
          allowUnknown: this.options.allowUnknown,
        }
      );

      if (!validationResult.valid) {
        const errorMessage = this.formatValidationErrors(validationResult);
        
        this.structuredLogger.warn(
          'Request validation failed',
          {
            ...this.contextService.toLogContext(),
            metadata: {
              schema: schemaName,
              errors: validationResult.errors,
              parameterType: metadata.type,
            },
          }
        );

        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationResult.errors,
          statusCode: 400,
        });
      }

      // Log sanitization warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        this.structuredLogger.log(
          'Input sanitized during validation',
          {
            ...this.contextService.toLogContext(),
            metadata: {
              schema: schemaName,
              warnings: validationResult.warnings,
              parameterType: metadata.type,
            },
          }
        );
      }

      return this.options.transform !== false ? validationResult.data : value;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Validation pipe error for schema ${schemaName}:`, error);
      throw new BadRequestException('Validation processing failed');
    }
  }

  private getSchemaFromMetadata(metadata: ArgumentMetadata): string | null {
    // Try to infer schema from various sources
    const metatype = metadata.metatype;
    
    if (!metatype) return null;

    // Check if the class has a validation schema decorator
    const schemaName = Reflect.getMetadata('validation:schema', metatype);
    if (schemaName) return schemaName;

    // Try to infer from class name
    const className = metatype.name;
    const schemaMap: Record<string, string> = {
      'CreateLeadDto': 'createLead',
      'UpdateLeadStatusDto': 'updateLeadStatus',
      'LeadListDto': 'pagination',
      'PaginationDto': 'pagination',
    };

    return schemaMap[className] || null;
  }

  private formatValidationErrors(result: ValidationResult): string {
    if (!result.errors || result.errors.length === 0) {
      return 'Validation failed';
    }

    const errorMessages = result.errors.map(error => 
      `${error.field}: ${error.message}`
    );

    return `Validation failed: ${errorMessages.join(', ')}`;
  }
}

/**
 * Decorator to specify validation schema for a DTO class
 */
export function ValidateWith(schemaName: string) {
  return function (target: any) {
    Reflect.defineMetadata('validation:schema', schemaName, target);
    return target;
  };
}