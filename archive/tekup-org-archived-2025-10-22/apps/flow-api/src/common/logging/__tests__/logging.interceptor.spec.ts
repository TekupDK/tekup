import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from '../logging.interceptor.js';
import { StructuredLoggerService } from '../structured-logger.service.js';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: jest.Mocked<StructuredLoggerService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    mockLogger = {
      runWithContext: jest.fn((context, fn) => fn()),
      generateCorrelationId: jest.fn(() => 'test-correlation-id'),
      http: jest.fn(),
      apiRequest: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockRequest = {
      method: 'GET',
      url: '/api/leads?page=1',
      path: '/api/leads',
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '192.168.1.1',
      },
      query: { page: '1' },
      params: {},
      connection: { remoteAddress: '127.0.0.1' },
    };

    mockResponse = {
      setHeader: jest.fn(),
      statusCode: 200,
      getHeader: jest.fn(() => '1024'),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn(() => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      })),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        { provide: StructuredLoggerService, useValue: mockLogger },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('successful requests', () => {
    it('should log incoming request and successful response', (done) => {
      const responseData = { data: 'test' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(responseData);
          
          // Should set correlation headers
          expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'test-correlation-id');
          expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
          
          // Should log incoming request
          expect(mockLogger.http).toHaveBeenCalledWith(
            'Incoming GET /api/leads',
            expect.objectContaining({
              method: 'GET',
              url: '/api/leads?page=1',
              userAgent: 'test-agent',
              ip: '192.168.1.1',
            })
          );
          
          // Should log successful response
          expect(mockLogger.apiRequest).toHaveBeenCalledWith(
            'GET',
            '/api/leads',
            200,
            expect.any(Number),
            expect.objectContaining({
              method: 'GET',
              statusCode: 200,
            })
          );
          
          done();
        },
        error: done,
      });
    });

    it('should extract correlation ID from request headers', (done) => {
      const existingCorrelationId = 'existing-correlation-id';
      mockRequest.headers['x-correlation-id'] = existingCorrelationId;
      
      mockCallHandler.handle.mockReturnValue(of({}));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => {
          expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', existingCorrelationId);
          done();
        },
        error: done,
      });
    });

    it('should extract tenant ID from API key header', (done) => {
      mockRequest.headers['x-tenant-key'] = 'tenant-api-key';
      mockRequest.tenantId = 'tenant123';
      
      mockCallHandler.handle.mockReturnValue(of({}));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => {
          expect(mockLogger.runWithContext).toHaveBeenCalledWith(
            expect.objectContaining({
              tenantId: 'tenant123',
            }),
            expect.any(Function)
          );
          done();
        },
        error: done,
      });
    });

    it('should extract tenant ID from URL path', (done) => {
      mockRequest.path = '/api/tenants/tenant456/leads';
      
      mockCallHandler.handle.mockReturnValue(of({}));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => {
          expect(mockLogger.runWithContext).toHaveBeenCalledWith(
            expect.objectContaining({
              tenantId: 'tenant456',
            }),
            expect.any(Function)
          );
          done();
        },
        error: done,
      });
    });

    it('should log slow requests as warnings', (done) => {
      mockCallHandler.handle.mockReturnValue(of({}));
      
      // Mock Date.now to simulate slow request
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 1000 : 2500; // 1500ms duration
      });

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => {
          expect(mockLogger.warn).toHaveBeenCalledWith(
            'Slow request detected',
            expect.objectContaining({
              duration: 1500,
              threshold: 1000,
            })
          );
          
          Date.now = originalDateNow;
          done();
        },
        error: (err) => {
          Date.now = originalDateNow;
          done(err);
        },
      });
    });
  });

  describe('error handling', () => {
    it('should log error responses', (done) => {
      const error = new Error('Test error');
      (error as any).status = 400;
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => done(new Error('Should not reach here')),
        error: (err) => {
          expect(err).toBe(error);
          
          // Should log error
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Request failed: GET /api/leads',
            error,
            expect.objectContaining({
              method: 'GET',
              statusCode: 400,
              errorName: 'Error',
              errorMessage: 'Test error',
            })
          );
          
          // Should log API request with error status
          expect(mockLogger.apiRequest).toHaveBeenCalledWith(
            'GET',
            '/api/leads',
            400,
            expect.any(Number),
            expect.objectContaining({
              method: 'GET',
              statusCode: 400,
            })
          );
          
          done();
        },
      });
    });

    it('should handle errors without status code', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => done(new Error('Should not reach here')),
        error: (err) => {
          expect(mockLogger.error).toHaveBeenCalledWith(
            expect.any(String),
            error,
            expect.objectContaining({
              statusCode: 500, // Default status
            })
          );
          
          done();
        },
      });
    });
  });

  describe('utility methods', () => {
    it('should sanitize URLs with sensitive parameters', () => {
      const url = '/api/users?password=secret&token=abc123&name=john';
      const sanitized = interceptor['sanitizeUrl'](url);

      expect(sanitized).toContain('password=***');
      expect(sanitized).toContain('token=***');
      expect(sanitized).toContain('name=john');
      expect(sanitized).not.toContain('secret');
      expect(sanitized).not.toContain('abc123');
    });

    it('should sanitize query parameters', () => {
      const query = {
        page: '1',
        password: 'secret',
        token: 'abc123',
        name: 'john',
      };

      const sanitized = interceptor['sanitizeQuery'](query);

      expect(sanitized).toEqual({
        page: '1',
        password: '***',
        token: '***',
        name: 'john',
      });
    });

    it('should handle non-object query parameters', () => {
      const query = 'string-query';
      const sanitized = interceptor['sanitizeQuery'](query);
      expect(sanitized).toBe(query);
    });

    it('should get client IP from various headers', () => {
      // Test x-forwarded-for
      mockRequest.headers['x-forwarded-for'] = '203.0.113.1';
      let ip = interceptor['getClientIp'](mockRequest);
      expect(ip).toBe('203.0.113.1');

      // Test x-real-ip
      delete mockRequest.headers['x-forwarded-for'];
      mockRequest.headers['x-real-ip'] = '203.0.113.2';
      ip = interceptor['getClientIp'](mockRequest);
      expect(ip).toBe('203.0.113.2');

      // Test connection.remoteAddress
      delete mockRequest.headers['x-real-ip'];
      mockRequest.connection = { remoteAddress: '203.0.113.3' };
      ip = interceptor['getClientIp'](mockRequest);
      expect(ip).toBe('203.0.113.3');

      // Test fallback to unknown
      delete mockRequest.connection;
      ip = interceptor['getClientIp'](mockRequest);
      expect(ip).toBe('unknown');
    });

    it('should calculate response size', () => {
      const data = { message: 'test', count: 5 };
      const size = interceptor['getResponseSize'](data);
      
      expect(size).toBe(JSON.stringify(data).length);
    });

    it('should handle response size calculation errors', () => {
      const circularData = {};
      (circularData as any).self = circularData;
      
      const size = interceptor['getResponseSize'](circularData);
      expect(size).toBe(0);
    });
  });

  describe('correlation ID generation', () => {
    it('should generate request ID with proper format', () => {
      const requestId = interceptor['generateRequestId']();
      
      expect(requestId).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('should extract correlation ID from various headers', () => {
      const testCases = [
        { header: 'x-correlation-id', value: 'test-id-1' },
        { header: 'x-request-id', value: 'test-id-2' },
        { header: 'correlation-id', value: 'test-id-3' },
        { header: 'request-id', value: 'test-id-4' },
      ];

      testCases.forEach(({ header, value }) => {
        mockRequest.headers = { [header]: value };
        const extracted = interceptor['extractOrGenerateCorrelationId'](mockRequest);
        expect(extracted).toBe(value);
      });
    });

    it('should generate new correlation ID when none exists', () => {
      mockRequest.headers = {};
      const correlationId = interceptor['extractOrGenerateCorrelationId'](mockRequest);
      
      expect(correlationId).toBe('test-correlation-id');
      expect(mockLogger.generateCorrelationId).toHaveBeenCalled();
    });

    it('should handle array header values', () => {
      mockRequest.headers = { 'x-correlation-id': ['first-id', 'second-id'] };
      const correlationId = interceptor['extractOrGenerateCorrelationId'](mockRequest);
      
      expect(correlationId).toBe('test-correlation-id');
      expect(mockLogger.generateCorrelationId).toHaveBeenCalled();
    });
  });
});