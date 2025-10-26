import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Ajv, { JSONSchemaType, ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import * as DOMPurify from 'isomorphic-dompurify';
import * as validator from 'validator';

export interface ValidationSchema {
  schema: JSONSchemaType<any>;
  sanitizers?: SanitizerConfig[];
  customValidators?: CustomValidator[];
}

export interface SanitizerConfig {
  field: string;
  type: 'html' | 'sql' | 'xss' | 'trim' | 'lowercase' | 'normalize' | 'email' | 'phone';
  options?: Record<string, any>;
}

export interface CustomValidator {
  field: string;
  validator: (value: any, data: any) => boolean | Promise<boolean>;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  data?: any;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  sanitized?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  originalValue?: any;
  sanitizedValue?: any;
}

export interface SchemaRegistry {
  [key: string]: ValidationSchema;
}

@Injectable()
export class InputValidationService {
  private readonly logger = new Logger(InputValidationService.name);
  private readonly ajv: Ajv;
  private readonly compiledSchemas = new Map<string, ValidateFunction>();
  private readonly schemaRegistry: SchemaRegistry = {};

  constructor(
    private readonly configService: ConfigService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {
    // Initialize AJV with security-focused configuration
    this.ajv = new Ajv({
      allErrors: true,
      removeAdditional: true, // Remove additional properties
      useDefaults: true,
      coerceTypes: true,
      strict: true,
      validateFormats: true,
    });

    // Add format validators
    addFormats(this.ajv);

    // Add custom security formats
    this.addCustomFormats();

    // Initialize default schemas
    this.initializeDefaultSchemas();
  }

  /**
   * Register a validation schema
   */
  registerSchema(name: string, schema: ValidationSchema): void {
    this.schemaRegistry[name] = schema;
    
    try {
      const validateFunction = this.ajv.compile(schema.schema);
      this.compiledSchemas.set(name, validateFunction);
      
      this.logger.log(`Registered validation schema: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to compile schema ${name}:`, error);
      throw new Error(`Invalid schema: ${name}`);
    }
  }

  /**
   * Validate and sanitize input data
   */
  async validateAndSanitize(
    schemaName: string,
    data: any,
    options: {
      strict?: boolean;
      sanitize?: boolean;
      allowUnknown?: boolean;
    } = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const schema = this.schemaRegistry[schemaName];
    const validateFunction = this.compiledSchemas.get(schemaName);

    if (!schema || !validateFunction) {
      throw new Error(`Schema not found: ${schemaName}`);
    }

    try {
      let processedData = JSON.parse(JSON.stringify(data)); // Deep clone
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      let sanitized = false;

      // Step 1: Input sanitization
      if (options.sanitize !== false && schema.sanitizers) {
        const sanitizationResult = await this.sanitizeData(
          processedData,
          schema.sanitizers
        );
        processedData = sanitizationResult.data;
        warnings.push(...sanitizationResult.warnings);
        sanitized = sanitizationResult.sanitized;
      }

      // Step 2: Schema validation
      const isValid = validateFunction(processedData);
      
      if (!isValid && validateFunction.errors) {
        for (const error of validateFunction.errors) {
          errors.push(this.formatAjvError(error));
        }
      }

      // Step 3: Custom validation
      if (schema.customValidators) {
        const customValidationResult = await this.runCustomValidators(
          processedData,
          schema.customValidators
        );
        errors.push(...customValidationResult.errors);
      }

      // Step 4: Security validation
      const securityValidationResult = await this.performSecurityValidation(
        processedData,
        schemaName
      );
      errors.push(...securityValidationResult.errors);
      warnings.push(...securityValidationResult.warnings);

      const result: ValidationResult = {
        valid: errors.length === 0,
        data: processedData,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        sanitized,
      };

      // Log validation metrics
      const duration = Date.now() - startTime;
      this.metricsService.increment('input_validation_total', {
        schema: schemaName,
        valid: result.valid.toString(),
        sanitized: sanitized.toString(),
      });
      
      this.metricsService.histogram('input_validation_duration_ms', duration, {
        schema: schemaName,
      });

      // Log validation events
      if (!result.valid) {
        this.structuredLogger.warn(
          'Input validation failed',
          {
            ...this.contextService.toLogContext(),
            metadata: {
              schema: schemaName,
              errors: errors.map(e => ({ field: e.field, code: e.code })),
              errorCount: errors.length,
              duration,
            },
          }
        );
      } else if (warnings.length > 0) {
        this.structuredLogger.log(
          'Input sanitized during validation',
          {
            ...this.contextService.toLogContext(),
            metadata: {
              schema: schemaName,
              warnings: warnings.map(w => ({ field: w.field, message: w.message })),
              warningCount: warnings.length,
              duration,
            },
          }
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Validation error for schema ${schemaName}:`, error);
      this.metricsService.increment('input_validation_errors_total', {
        schema: schemaName,
      });
      
      throw new BadRequestException('Validation processing failed');
    }
  }

  /**
   * Sanitize data according to sanitizer configuration
   */
  private async sanitizeData(
    data: any,
    sanitizers: SanitizerConfig[]
  ): Promise<{
    data: any;
    warnings: ValidationWarning[];
    sanitized: boolean;
  }> {
    const warnings: ValidationWarning[] = [];
    let sanitized = false;
    const processedData = { ...data };

    for (const sanitizer of sanitizers) {
      const value = this.getNestedValue(processedData, sanitizer.field);
      
      if (value === undefined || value === null) continue;

      const originalValue = value;
      let sanitizedValue: any;

      switch (sanitizer.type) {
        case 'html':
          sanitizedValue = DOMPurify.sanitize(String(value), {
            ALLOWED_TAGS: sanitizer.options?.allowedTags || [],
            ALLOWED_ATTR: sanitizer.options?.allowedAttributes || [],
          });
          break;

        case 'xss':
          sanitizedValue = this.sanitizeXSS(String(value));
          break;

        case 'sql':
          sanitizedValue = this.sanitizeSQL(String(value));
          break;

        case 'trim':
          sanitizedValue = String(value).trim();
          break;

        case 'lowercase':
          sanitizedValue = String(value).toLowerCase();
          break;

        case 'normalize':
          sanitizedValue = validator.normalizeEmail(String(value)) || value;
          break;

        case 'email':
          sanitizedValue = validator.normalizeEmail(String(value)) || value;
          if (!validator.isEmail(sanitizedValue)) {
            warnings.push({
              field: sanitizer.field,
              message: 'Invalid email format',
              originalValue,
              sanitizedValue,
            });
          }
          break;

        case 'phone':
          sanitizedValue = String(value).replace(/[^\\d\\+\\-\\(\\)\\s]/g, '');
          break;

        default:
          sanitizedValue = value;
      }

      if (sanitizedValue !== originalValue) {
        this.setNestedValue(processedData, sanitizer.field, sanitizedValue);
        sanitized = true;
        
        warnings.push({
          field: sanitizer.field,
          message: `Value sanitized using ${sanitizer.type} sanitizer`,
          originalValue,
          sanitizedValue,
        });
      }
    }

    return { data: processedData, warnings, sanitized };
  }

  /**
   * Run custom validators
   */
  private async runCustomValidators(
    data: any,
    validators: CustomValidator[]
  ): Promise<{ errors: ValidationError[] }> {
    const errors: ValidationError[] = [];

    for (const validator of validators) {
      try {
        const value = this.getNestedValue(data, validator.field);
        const isValid = await validator.validator(value, data);
        
        if (!isValid) {
          errors.push({
            field: validator.field,
            message: validator.message,
            value,
            code: 'CUSTOM_VALIDATION_FAILED',
            severity: 'error',
          });
        }
      } catch (error) {
        this.logger.error(`Custom validator error for field ${validator.field}:`, error);
        errors.push({
          field: validator.field,
          message: 'Custom validation failed',
          code: 'CUSTOM_VALIDATOR_ERROR',
          severity: 'error',
        });
      }
    }

    return { errors };
  }

  /**
   * Perform security-focused validation
   */
  private async performSecurityValidation(
    data: any,
    schemaName: string
  ): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for potential injection attacks
    this.checkForInjectionAttempts(data, '', errors, warnings);

    // Check for suspicious patterns
    this.checkForSuspiciousPatterns(data, '', warnings);

    // Check data size limits
    const dataSize = JSON.stringify(data).length;
    const maxSize = this.configService.get('MAX_REQUEST_SIZE', '1000000'); // 1MB default
    
    if (dataSize > parseInt(maxSize)) {
      errors.push({
        field: '_root',
        message: 'Request data size exceeds limit',
        code: 'DATA_SIZE_EXCEEDED',
        severity: 'error',
      });
    }

    return { errors, warnings };
  }

  /**
   * Check for injection attempts
   */
  private checkForInjectionAttempts(
    obj: any,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (typeof obj === 'string') {
      // SQL injection patterns
      const sqlPatterns = [
        /('|(\\-\\-)|;|\\||\\*|(%27)|(%2D%2D)|(%7C)|(%2A))/i,
        /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      ];

      // XSS patterns
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
      ];

      // NoSQL injection patterns
      const nosqlPatterns = [
        /\$where/i,
        /\$regex/i,
        /\$ne/i,
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(obj)) {
          errors.push({
            field: path || '_root',
            message: 'Potential SQL injection detected',
            value: obj,
            code: 'SQL_INJECTION_DETECTED',
            severity: 'error',
          });
          break;
        }
      }

      for (const pattern of xssPatterns) {
        if (pattern.test(obj)) {
          warnings.push({
            field: path || '_root',
            message: 'Potential XSS content detected',
            originalValue: obj,
          });
          break;
        }
      }

      for (const pattern of nosqlPatterns) {
        if (pattern.test(obj)) {
          errors.push({
            field: path || '_root',
            message: 'Potential NoSQL injection detected',
            value: obj,
            code: 'NOSQL_INJECTION_DETECTED',
            severity: 'error',
          });
          break;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        this.checkForInjectionAttempts(value, newPath, errors, warnings);
      }
    }
  }

  /**
   * Check for suspicious patterns
   */
  private checkForSuspiciousPatterns(
    obj: any,
    path: string,
    warnings: ValidationWarning[]
  ): void {
    if (typeof obj === 'string') {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        { pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/, message: 'Control characters detected' },
        { pattern: /\.\.[\\/]/, message: 'Path traversal attempt detected' },
        { pattern: /<\?php/i, message: 'PHP code injection attempt detected' },
        { pattern: /<%.*?%>/, message: 'Server-side template injection detected' },
      ];

      for (const { pattern, message } of suspiciousPatterns) {
        if (pattern.test(obj)) {
          warnings.push({
            field: path || '_root',
            message,
            originalValue: obj,
          });
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        this.checkForSuspiciousPatterns(value, newPath, warnings);
      }
    }
  }

  /**
   * Sanitize XSS content
   */
  private sanitizeXSS(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Sanitize SQL content
   */
  private sanitizeSQL(input: string): string {
    return input
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[\-]{2}/g, '') // Remove comment markers
      .replace(/[;|*]/g, ''); // Remove dangerous characters
  }

  /**
   * Format AJV validation errors
   */
  private formatAjvError(error: ErrorObject): ValidationError {
    const field = error.instancePath.replace(/^\/+/, '').replace(/\//g, '.') || error.keyword;
    
    return {
      field,
      message: error.message || 'Validation failed',
      value: error.data,
      code: `SCHEMA_${error.keyword.toUpperCase()}`,
      severity: 'error',
    };
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Add custom formats for security validation
   */
  private addCustomFormats(): void {
    // Safe string format (no HTML, scripts, etc.)
    this.ajv.addFormat('safeString', {
      type: 'string',
      validate: (data: string) => {
        return !/<[^>]*>/.test(data) && !/javascript:/i.test(data);
      },
    });

    // SQL-safe string
    this.ajv.addFormat('sqlSafe', {
      type: 'string',
      validate: (data: string) => {
        const dangerous = /('|(\-\-)|;|\||\*|union|select|insert|delete|update|drop)/i;
        return !dangerous.test(data);
      },
    });

    // Tenant ID format
    this.ajv.addFormat('tenantId', {
      type: 'string',
      validate: (data: string) => {
        return /^[a-zA-Z0-9\-_]{1,50}$/.test(data);
      },
    });
  }

  /**
   * Initialize default validation schemas
   */
  private initializeDefaultSchemas(): void {
    // Lead creation schema
    this.registerSchema('createLead', {
      schema: {
        type: 'object',
        properties: {
          source: { type: 'string', format: 'safeString', maxLength: 100 },
          payload: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email', maxLength: 255 },
              phone: { type: 'string', pattern: '^[\\+]?[0-9\\s\\-\\(\\)]{1,20}$' },
              name: { type: 'string', format: 'safeString', maxLength: 255 },
              message: { type: 'string', format: 'safeString', maxLength: 2000 },
            },
            additionalProperties: false,
          },
        },
        required: ['source'],
        additionalProperties: false,
      } as JSONSchemaType<any>,
      sanitizers: [
        { field: 'source', type: 'trim' },
        { field: 'payload.email', type: 'email' },
        { field: 'payload.phone', type: 'phone' },
        { field: 'payload.name', type: 'trim' },
        { field: 'payload.message', type: 'xss' },
      ],
    });

    // Lead status update schema
    this.registerSchema('updateLeadStatus', {
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['NEW', 'CONTACTED'] },
        },
        required: ['status'],
        additionalProperties: false,
      } as JSONSchemaType<any>,
    });

    // Pagination schema
    this.registerSchema('pagination', {
      schema: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          cursor: { type: 'string', format: 'safeString', maxLength: 255 },
          sortField: { type: 'string', enum: ['createdAt', 'updatedAt', 'status'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          search: { type: 'string', format: 'safeString', maxLength: 255 },
          status: { type: 'string', enum: ['NEW', 'CONTACTED'] },
          source: { type: 'string', format: 'safeString', maxLength: 100 },
          createdAfter: { type: 'string', format: 'date-time' },
          createdBefore: { type: 'string', format: 'date-time' },
        },
        additionalProperties: false,
      } as JSONSchemaType<any>,
      sanitizers: [
        { field: 'search', type: 'xss' },
        { field: 'source', type: 'trim' },
      ],
    });
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): any {
    return {
      registeredSchemas: Object.keys(this.schemaRegistry).length,
      compiledSchemas: this.compiledSchemas.size,
      schemas: Object.keys(this.schemaRegistry),
    };
  }
}