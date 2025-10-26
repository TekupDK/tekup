import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomExceptionFilter } from '../custom-exception.filter.js';
import { StructuredLoggerService } from '../../logging/structured-logger.service.js';
import {
  BusinessValidationException,
  RateLimitExceededException,
  TimeoutException,
} from '../custom-exceptions.js';

describe('CustomExceptionFilter', () => {
  let filter: CustomExceptionFilter;
  let mockLogger: jest.Mocked<StructuredLoggerService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      securityEvent: jest.fn(),
    } as any;

    mockRequest = {
      url: '/api/leads',
      method: 'GET',
      path: '/api/leads',
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '192.168.1.1',
      },
      correlationId: 'test-correlation-id',
      requestId: 'test-request-id',
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn(() => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      })),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomExceptionFilter,
        { provide: StructuredLoggerService, useValue: mockLogger },
      ],
    }).compile();

    filter = module.get<CustomExceptionFilter>(CustomExceptionFilter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HTTP exceptions', () => {
    it('should handle HttpException correctly', () => {
      const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Bad request',
          error: 'HttpException',
          retryable: false,
          correlationId: 'test-correlation-id',
          requestId: 'test-request-id',
        })
      );
    });

    it('should handle HttpException with object response', () => {
      const response = { message: 'Validation failed', errors: ['field required'] };
      const exception = new HttpException(response, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Validation failed',
          details: response,
        })
      );
    });
  });

  describe('custom exceptions', () => {
    it('should handle BusinessValidationException', () => {
      const exception = new BusinessValidationException('Invalid input', 'INVALID_INPUT');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid input',
          retryable: false,
        })
      );
    });

    it('should handle RateLimitExceededException with retry headers', () => {
      const exception = new RateLimitExceededException(100, 60, 120);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 120);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Retry-After', 120);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Error-Retryable', 'true');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          retryable: true,
          retryAfter: 120,
        })
      );
    });

    it('should handle TimeoutException', () => {
      const exception = new TimeoutException('database_query', 5000, 10);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(408);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 408,
          retryable: true,
          retryAfter: 10,
        })
      );
    });
  });

  describe('generic errors', () => {
    it('should handle generic Error objects', () => {
      const error = new Error('Something went wrong');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Something went wrong',
          error: 'Error',
          retryable: true, // 500 errors are retryable
        })
      );
    });

    it('should handle unknown exceptions', () => {
      const exception = 'string exception';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Unknown error occurred',
          error: 'UnknownError',
        })
      );
    });
  });

  describe('error mapping', () => {
    it('should map database unique constraint errors to 409', () => {
      const error = new Error('Unique constraint violation');
      error.name = 'PrismaClientKnownRequestError';

      const status = filter['mapErrorToHttpStatus'](error);
      expect(status).toBe(HttpStatus.CONFLICT);
    });

    it('should map timeout errors to 408', () => {
      const error = new Error('Request timeout');
      error.name = 'TimeoutError';

      const status = filter['mapErrorToHttpStatus'](error);
      expect(status).toBe(HttpStatus.REQUEST_TIMEOUT);
    });

    it('should map validation errors to 400', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      const status = filter['mapErrorToHttpStatus'](error);
      expect(status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should map unauthorized errors to 401', () => {
      const error = new Error('Unauthorized access');
      error.name = 'UnauthorizedError';

      const status = filter['mapErrorToHttpStatus'](error);
      expect(status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('retry determination', () => {
    it('should mark 5xx errors as retryable', () => {
      const retryInfo = filter['determineRetryability'](null, 500);
      
      expect(retryInfo.isRetryable).toBe(true);
      expect(retryInfo.retryAfter).toBeDefined();
      expect(retryInfo.maxRetries).toBe(3);
    });

    it('should mark 408 as retryable', () => {
      const retryInfo = filter['determineRetryability'](null, 408);
      
      expect(retryInfo.isRetryable).toBe(true);
      expect(retryInfo.retryAfter).toBe(5);
    });

    it('should mark 429 as retryable', () => {
      const retryInfo = filter['determineRetryability'](null, 429);
      
      expect(retryInfo.isRetryable).toBe(true);
      expect(retryInfo.retryAfter).toBe(60);
    });

    it('should mark most 4xx errors as non-retryable', () => {
      const retryInfo = filter['determineRetryability'](null, 400);
      expect(retryInfo.isRetryable).toBe(false);
    });

    it('should extract retry-after from exception', () => {
      const exception = new HttpException({ retryAfter: 300 }, 429);
      const retryAfter = filter['extractRetryAfterFromException'](exception);
      
      expect(retryAfter).toBe(300);
    });
  });

  describe('logging', () => {
    it('should log server errors', () => {
      const exception = new Error('Server error');
      (exception as any).status = 500;

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Server error'),
        exception,
        expect.objectContaining({
          statusCode: 500,
          correlationId: 'test-correlation-id',
        })
      );
    });

    it('should log client errors as warnings', () => {
      const exception = new HttpException('Bad request', 400);

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Client error'),
        expect.objectContaining({
          statusCode: 400,
        })
      );
    });

    it('should log suspicious activity', () => {
      mockRequest.path = '/admin/secret';
      const exception = new HttpException('Forbidden', 403);

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.securityEvent).toHaveBeenCalledWith(
        'suspicious_request_pattern',
        'medium',
        expect.objectContaining({
          statusCode: 403,
          reason: 'Multiple client errors or potential attack pattern',
        })
      );
    });
  });

  describe('client IP extraction', () => {
    it('should extract IP from x-forwarded-for header', () => {
      mockRequest.headers!['x-forwarded-for'] = '203.0.113.1';
      
      const ip = filter['getClientIp'](mockRequest as Request);
      expect(ip).toBe('203.0.113.1');
    });

    it('should extract IP from x-real-ip header', () => {
      delete mockRequest.headers!['x-forwarded-for'];
      mockRequest.headers!['x-real-ip'] = '203.0.113.2';
      
      const ip = filter['getClientIp'](mockRequest as Request);
      expect(ip).toBe('203.0.113.2');
    });

    it('should fallback to connection remote address', () => {
      delete mockRequest.headers!['x-forwarded-for'];
      delete mockRequest.headers!['x-real-ip'];
      (mockRequest as any).connection = { remoteAddress: '203.0.113.3' };
      
      const ip = filter['getClientIp'](mockRequest as Request);
      expect(ip).toBe('203.0.113.3');
    });

    it('should return unknown when no IP available', () => {
      delete mockRequest.headers!['x-forwarded-for'];
      delete mockRequest.headers!['x-real-ip'];
      delete (mockRequest as any).connection;
      
      const ip = filter['getClientIp'](mockRequest as Request);
      expect(ip).toBe('unknown');
    });
  });

  describe('suspicious activity detection', () => {
    it('should detect suspicious status codes', () => {
      expect(filter['isSuspiciousError'](401, mockRequest as Request)).toBe(true);
      expect(filter['isSuspiciousError'](403, mockRequest as Request)).toBe(true);
      expect(filter['isSuspiciousError'](404, mockRequest as Request)).toBe(true);
    });

    it('should detect suspicious paths', () => {
      mockRequest.path = '/admin/users';
      expect(filter['isSuspiciousError'](200, mockRequest as Request)).toBe(true);

      mockRequest.path = '/wp-admin/';
      expect(filter['isSuspiciousError'](200, mockRequest as Request)).toBe(true);

      mockRequest.path = '/.env';
      expect(filter['isSuspiciousError'](200, mockRequest as Request)).toBe(true);
    });

    it('should not flag normal requests as suspicious', () => {
      mockRequest.path = '/api/leads';
      expect(filter['isSuspiciousError'](200, mockRequest as Request)).toBe(false);
      expect(filter['isSuspiciousError'](500, mockRequest as Request)).toBe(false);
    });
  });

  describe('development mode', () => {
    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: error.stack,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.anything(),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});