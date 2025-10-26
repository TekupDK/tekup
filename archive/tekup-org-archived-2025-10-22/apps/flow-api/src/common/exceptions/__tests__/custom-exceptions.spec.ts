import { HttpStatus } from '@nestjs/common';
import {
  BaseCustomException,
  BusinessValidationException,
  ResourceNotFoundException,
  DuplicateResourceException,
  DatabaseOperationException,
  ExternalServiceException,
  RateLimitExceededException,
  TimeoutException,
  InsufficientPermissionsException,
  InvalidTenantException,
  ConfigurationException,
  MaintenanceModeException,
  QuotaExceededException,
  DependencyUnavailableException,
  ExceptionUtils,
} from '../custom-exceptions.js';

describe('Custom Exceptions', () => {
  describe('BaseCustomException', () => {
    it('should create base exception with all properties', () => {
      const exception = new (class extends BaseCustomException {
        constructor() {
          super(
            'Test message',
            HttpStatus.BAD_REQUEST,
            true,
            60,
            'TEST_ERROR',
            { key: 'value' }
          );
        }
      })();

      expect(exception.message).toBe('Test message');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.isRetryable).toBe(true);
      expect(exception.retryAfter).toBe(60);
      expect(exception.errorCode).toBe('TEST_ERROR');
      expect(exception.context).toEqual({ key: 'value' });
    });
  });

  describe('BusinessValidationException', () => {
    it('should create business validation exception', () => {
      const exception = new BusinessValidationException(
        'Invalid email format',
        'INVALID_EMAIL',
        { field: 'email' }
      );

      expect(exception.message).toBe('Invalid email format');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.isRetryable).toBe(false);
      expect(exception.errorCode).toBe('INVALID_EMAIL');
      expect(exception.context).toEqual({ field: 'email' });
      expect(exception.name).toBe('BusinessValidationException');
    });
  });

  describe('ResourceNotFoundException', () => {
    it('should create resource not found exception with identifier', () => {
      const exception = new ResourceNotFoundException('Lead', '123', { tenantId: 'tenant1' });

      expect(exception.message).toBe("Lead with identifier '123' not found");
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.isRetryable).toBe(false);
      expect(exception.errorCode).toBe('RESOURCE_NOT_FOUND');
      expect(exception.context).toEqual({
        resource: 'Lead',
        identifier: '123',
        tenantId: 'tenant1',
      });
    });

    it('should create resource not found exception without identifier', () => {
      const exception = new ResourceNotFoundException('User');

      expect(exception.message).toBe('User not found');
      expect(exception.context).toEqual({
        resource: 'User',
        identifier: undefined,
      });
    });
  });

  describe('DuplicateResourceException', () => {
    it('should create duplicate resource exception', () => {
      const exception = new DuplicateResourceException(
        'User',
        'email',
        'test@example.com',
        { tenantId: 'tenant1' }
      );

      expect(exception.message).toBe("User with email 'test@example.com' already exists");
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.isRetryable).toBe(false);
      expect(exception.errorCode).toBe('DUPLICATE_RESOURCE');
      expect(exception.context).toEqual({
        resource: 'User',
        field: 'email',
        value: 'test@example.com',
        tenantId: 'tenant1',
      });
    });
  });

  describe('DatabaseOperationException', () => {
    it('should create database operation exception', () => {
      const originalError = new Error('Connection timeout');
      const exception = new DatabaseOperationException(
        'findMany',
        originalError,
        { table: 'leads' }
      );

      expect(exception.message).toBe("Database operation 'findMany' failed: Connection timeout");
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.isRetryable).toBe(true);
      expect(exception.retryAfter).toBe(5);
      expect(exception.errorCode).toBe('DATABASE_OPERATION_FAILED');
      expect(exception.context).toEqual({
        operation: 'findMany',
        originalError: 'Connection timeout',
        table: 'leads',
      });
    });
  });

  describe('ExternalServiceException', () => {
    it('should create external service exception', () => {
      const originalError = new Error('Service unavailable');
      const exception = new ExternalServiceException(
        'EmailService',
        'sendEmail',
        originalError,
        60,
        { recipient: 'test@example.com' }
      );

      expect(exception.message).toBe("External service 'EmailService' operation 'sendEmail' failed: Service unavailable");
      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(exception.isRetryable).toBe(true);
      expect(exception.retryAfter).toBe(60);
      expect(exception.errorCode).toBe('EXTERNAL_SERVICE_FAILED');
      expect(exception.context).toEqual({
        serviceName: 'EmailService',
        operation: 'sendEmail',
        originalError: 'Service unavailable',
        recipient: 'test@example.com',
      });
    });
  });

  describe('RateLimitExceededException', () => {
    it('should create rate limit exceeded exception', () => {
      const exception = new RateLimitExceededException(
        100,
        60,
        120,
        { clientId: 'client123' }
      );

      expect(exception.message).toBe('Rate limit exceeded: 100 requests per 60 seconds');
      expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(exception.isRetryable).toBe(true);
      expect(exception.retryAfter).toBe(120);
      expect(exception.errorCode).toBe('RATE_LIMIT_EXCEEDED');
      expect(exception.context).toEqual({
        limit: 100,
        windowSeconds: 60,
        clientId: 'client123',
      });
    });
  });

  describe('TimeoutException', () => {
    it('should create timeout exception', () => {
      const exception = new TimeoutException(
        'database_query',
        5000,
        15,
        { query: 'SELECT * FROM leads' }
      );

      expect(exception.message).toBe("Operation 'database_query' timed out after 5000ms");
      expect(exception.getStatus()).toBe(HttpStatus.REQUEST_TIMEOUT);
      expect(exception.isRetryable).toBe(true);
      expect(exception.retryAfter).toBe(15);
      expect(exception.errorCode).toBe('OPERATION_TIMEOUT');
      expect(exception.context).toEqual({
        operation: 'database_query',
        timeoutMs: 5000,
        query: 'SELECT * FROM leads',
      });
    });
  });

  describe('InsufficientPermissionsException', () => {
    it('should create insufficient permissions exception', () => {
      const exception = new InsufficientPermissionsException(
        'leads',
        'delete',
        { userId: 'user123' }
      );

      expect(exception.message).toBe('Insufficient permissions to delete leads');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(exception.isRetryable).toBe(false);
      expect(exception.errorCode).toBe('INSUFFICIENT_PERMISSIONS');
      expect(exception.context).toEqual({
        resource: 'leads',
        action: 'delete',
        userId: 'user123',
      });
    });
  });

  describe('InvalidTenantException', () => {
    it('should create invalid tenant exception', () => {
      const exception = new InvalidTenantException('tenant123', { reason: 'inactive' });

      expect(exception.message).toBe('Invalid or inactive tenant: tenant123');
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(exception.isRetryable).toBe(false);
      expect(exception.errorCode).toBe('INVALID_TENANT');
      expect(exception.context).toEqual({
        tenantId: 'tenant123',
        reason: 'inactive',
      });
    });
  });

  describe('ConfigurationException', () => {
    it('should create configuration exception', () => {
      const exception = new ConfigurationException(
        'DATABASE_URL',
        'Missing required environment variable',
        { service: 'database' }
      );

      expect(exception.message).toBe("Configuration error for 'DATABASE_URL': Missing required environment variable");
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.isRetryable).toBe(false);
      expect(exception.errorCode).toBe('CONFIGURATION_ERROR');
      expect(exception.context).toEqual({
        configKey: 'DATABASE_URL',
        reason: 'Missing required environment variable',
        service: 'database',
      });
    });
  });

  describe('MaintenanceModeException', () => {
    it('should create maintenance mode exception with duration', () => {
      const exception = new MaintenanceModeException(30, { type: 'scheduled' });

      expect(exception.message).toBe('Service is in maintenance mode. Estimated duration: 30 minutes');
      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(exception.isRetryable).toBe(true);
      expect(exception.retryAfter).toBe(1800); // 30 minutes in seconds
      expect(exception.errorCode).toBe('MAINTENANCE_MODE');
      expect(exception.context).toEqual({
        estimatedDurationMinutes: 30,
        type: 'scheduled',
      });
    });

    it('should create maintenance mode exception without duration', () => {
      const exception = new MaintenanceModeException();

      expect(exception.message).toBe('Service is in maintenance mode');
      expect(exception.retryAfter).toBe(300); // 5 minutes default
    });
  });

  describe('QuotaExceededException', () => {
    it('should create quota exceeded exception with reset time', () => {
      const resetTime = new Date('2023-12-01T00:00:00Z');
      const exception = new QuotaExceededException(
        'API calls',
        1000,
        1050,
        resetTime,
        { plan: 'basic' }
      );

      expect(exception.message).toBe('API calls quota exceeded: 1050/1000');
      expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(exception.isRetryable).toBe(true);
      expect(exception.errorCode).toBe('QUOTA_EXCEEDED');
      expect(exception.context).toEqual({
        quotaType: 'API calls',
        limit: 1000,
        current: 1050,
        resetTime: resetTime.toISOString(),
        plan: 'basic',
      });
    });

    it('should create quota exceeded exception without reset time', () => {
      const exception = new QuotaExceededException('Storage', 100, 120);

      expect(exception.retryAfter).toBe(3600); // 1 hour default
    });
  });

  describe('DependencyUnavailableException', () => {
    it('should create dependency unavailable exception with reason', () => {
      const exception = new DependencyUnavailableException(
        'Redis',
        'Connection refused',
        45,
        { host: 'redis.example.com' }
      );

      expect(exception.message).toBe("Dependency 'Redis' is unavailable: Connection refused");
      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(exception.isRetryable).toBe(true);
      expect(exception.retryAfter).toBe(45);
      expect(exception.errorCode).toBe('DEPENDENCY_UNAVAILABLE');
      expect(exception.context).toEqual({
        dependencyName: 'Redis',
        reason: 'Connection refused',
        host: 'redis.example.com',
      });
    });

    it('should create dependency unavailable exception without reason', () => {
      const exception = new DependencyUnavailableException('Database');

      expect(exception.message).toBe("Dependency 'Database' is unavailable");
      expect(exception.context).toEqual({
        dependencyName: 'Database',
        reason: undefined,
      });
    });
  });

  describe('ExceptionUtils', () => {
    describe('isRetryable', () => {
      it('should identify retryable custom exceptions', () => {
        const retryableException = new DatabaseOperationException('query', new Error('timeout'));
        const nonRetryableException = new BusinessValidationException('invalid input');

        expect(ExceptionUtils.isRetryable(retryableException)).toBe(true);
        expect(ExceptionUtils.isRetryable(nonRetryableException)).toBe(false);
      });

      it('should identify retryable error patterns', () => {
        const timeoutError = new Error('Request timeout');
        const networkError = new Error('Network connection failed');
        const validationError = new Error('Validation failed');

        expect(ExceptionUtils.isRetryable(timeoutError)).toBe(true);
        expect(ExceptionUtils.isRetryable(networkError)).toBe(true);
        expect(ExceptionUtils.isRetryable(validationError)).toBe(false);
      });

      it('should identify retryable HTTP status codes', () => {
        const serverError = { status: 500 };
        const timeoutError = { status: 408 };
        const rateLimitError = { status: 429 };
        const clientError = { status: 400 };

        expect(ExceptionUtils.isRetryable(serverError)).toBe(true);
        expect(ExceptionUtils.isRetryable(timeoutError)).toBe(true);
        expect(ExceptionUtils.isRetryable(rateLimitError)).toBe(true);
        expect(ExceptionUtils.isRetryable(clientError)).toBe(false);
      });
    });

    describe('getRetryAfter', () => {
      it('should get retry after from custom exception', () => {
        const exception = new RateLimitExceededException(100, 60, 120);
        expect(ExceptionUtils.getRetryAfter(exception)).toBe(120);
      });

      it('should get retry after from HTTP headers', () => {
        const exception = {
          response: {
            headers: {
              'retry-after': '300',
            },
          },
        };
        expect(ExceptionUtils.getRetryAfter(exception)).toBe(300);
      });

      it('should return undefined when no retry after available', () => {
        const exception = new Error('Generic error');
        expect(ExceptionUtils.getRetryAfter(exception)).toBeUndefined();
      });
    });

    describe('fromError', () => {
      it('should return custom exception as-is', () => {
        const customException = new BusinessValidationException('test');
        const result = ExceptionUtils.fromError(customException);
        expect(result).toBe(customException);
      });

      it('should map Prisma unique constraint error', () => {
        const prismaError = { code: 'P2002', message: 'Unique constraint failed' };
        const result = ExceptionUtils.fromError(prismaError);
        expect(result).toBeInstanceOf(DuplicateResourceException);
      });

      it('should map Prisma record not found error', () => {
        const prismaError = { code: 'P2025', message: 'Record not found' };
        const result = ExceptionUtils.fromError(prismaError);
        expect(result).toBeInstanceOf(ResourceNotFoundException);
      });

      it('should map timeout errors', () => {
        const timeoutError = { code: 'ETIMEDOUT', message: 'Request timeout' };
        const result = ExceptionUtils.fromError(timeoutError);
        expect(result).toBeInstanceOf(TimeoutException);
      });

      it('should map rate limit errors', () => {
        const rateLimitError = { status: 429, message: 'Too many requests' };
        const result = ExceptionUtils.fromError(rateLimitError);
        expect(result).toBeInstanceOf(RateLimitExceededException);
      });

      it('should map server errors', () => {
        const serverError = { status: 500, message: 'Internal server error' };
        const result = ExceptionUtils.fromError(serverError);
        expect(result).toBeInstanceOf(ExternalServiceException);
      });

      it('should default to business validation error', () => {
        const genericError = { message: 'Unknown error' };
        const result = ExceptionUtils.fromError(genericError);
        expect(result).toBeInstanceOf(BusinessValidationException);
      });
    });
  });
});