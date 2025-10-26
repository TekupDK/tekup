import { Test, TestingModule } from '@nestjs/testing';
import { StructuredLoggerService, LogLevel } from '../structured-logger.service.js';

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    level: 'info',
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
    add: jest.fn(),
    isLevelEnabled: jest.fn(() => true),
    on: jest.fn(),
    end: jest.fn(),
    transports: [],
  })),
  format: {
    combine: jest.fn(() => ({})),
    timestamp: jest.fn(() => ({})),
    errors: jest.fn(() => ({})),
    json: jest.fn(() => ({})),
    printf: jest.fn(() => ({})),
    colorize: jest.fn(() => ({})),
    simple: jest.fn(() => ({})),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

describe('StructuredLoggerService', () => {
  let service: StructuredLoggerService;
  let mockLogger: any;

  beforeEach(async () => {
    const winston = await import('winston');
    mockLogger = {
      level: 'info',
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      http: jest.fn(),
      verbose: jest.fn(),
      debug: jest.fn(),
      silly: jest.fn(),
      add: jest.fn(),
      isLevelEnabled: jest.fn(() => true),
      on: jest.fn(),
      end: jest.fn(),
      transports: [],
    };

    (winston.createLogger as jest.Mock).mockReturnValue(mockLogger);

    const module: TestingModule = await Test.createTestingModule({
      providers: [StructuredLoggerService],
    }).compile();

    service = module.get<StructuredLoggerService>(StructuredLoggerService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('context management', () => {
    it('should set and get context', () => {
      const context = { tenantId: 'tenant1', userId: 'user1' };
      service.setContext(context);
      
      const retrievedContext = service.getContextualData();
      expect(retrievedContext).toEqual(expect.objectContaining(context));
    });

    it('should generate correlation ID', () => {
      const correlationId = service.generateCorrelationId();
      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(0);
    });

    it('should set correlation ID in context', () => {
      const correlationId = service.setCorrelationId();
      const context = service.getContextualData();
      
      expect(correlationId).toBeDefined();
      expect(context.correlationId).toBe(correlationId);
    });

    it('should use provided correlation ID', () => {
      const customId = 'custom-correlation-id';
      const returnedId = service.setCorrelationId(customId);
      const context = service.getContextualData();
      
      expect(returnedId).toBe(customId);
      expect(context.correlationId).toBe(customId);
    });

    it('should set tenant ID in context', () => {
      const tenantId = 'tenant123';
      service.setTenantId(tenantId);
      
      const context = service.getContextualData();
      expect(context.tenantId).toBe(tenantId);
    });

    it('should set user ID in context', () => {
      const userId = 'user123';
      service.setUserId(userId);
      
      const context = service.getContextualData();
      expect(context.userId).toBe(userId);
    });

    it('should run function with context', () => {
      const testContext = { tenantId: 'test-tenant' };
      let capturedContext: any;

      service.runWithContext(testContext, () => {
        capturedContext = service.getContextualData();
      });

      expect(capturedContext).toEqual(expect.objectContaining(testContext));
    });
  });

  describe('logging methods', () => {
    it('should log error with context', () => {
      const message = 'Test error';
      const error = new Error('Test error details');
      const context = { operation: 'test' };

      service.error(message, error, context);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: undefined,
        },
      });
    });

    it('should log error with string error', () => {
      const message = 'Test error';
      const error = 'String error';
      const context = { operation: 'test' };

      service.error(message, error, context);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        context,
        error: { message: error },
      });
    });

    it('should log warning', () => {
      const message = 'Test warning';
      const context = { operation: 'test' };

      service.warn(message, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, { context });
    });

    it('should log info', () => {
      const message = 'Test info';
      const context = { operation: 'test' };

      service.info(message, context);

      expect(mockLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should log debug', () => {
      const message = 'Test debug';
      const context = { operation: 'test' };

      service.debug(message, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, { context });
    });

    it('should log verbose', () => {
      const message = 'Test verbose';
      const context = { operation: 'test' };

      service.verbose(message, context);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, { context });
    });

    it('should log http', () => {
      const message = 'Test http';
      const context = { operation: 'test' };

      service.http(message, context);

      expect(mockLogger.http).toHaveBeenCalledWith(message, { context });
    });

    it('should use log method as alias for info', () => {
      const message = 'Test log';
      const context = { operation: 'test' };

      service.log(message, context);

      expect(mockLogger.info).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('specialized logging methods', () => {
    it('should log performance metrics', () => {
      const operation = 'database_query';
      const duration = 150;
      const context = { query: 'SELECT * FROM leads' };

      service.performance(operation, duration, context);

      expect(mockLogger.info).toHaveBeenCalledWith(`Performance: ${operation}`, {
        context,
        performance: {
          operation,
          duration,
        },
      });
    });

    it('should log query performance', () => {
      const query = 'SELECT * FROM leads WHERE tenant_id = ?';
      const duration = 75;
      const rowCount = 10;
      const context = { tenantId: 'tenant1' };

      service.queryPerformance(query, duration, rowCount, context);

      expect(mockLogger.info).toHaveBeenCalledWith('Database query executed', {
        context: {
          ...context,
          query: expect.any(String),
          rowCount,
        },
        performance: {
          operation: 'database_query',
          duration,
        },
      });
    });

    it('should log cache operations', () => {
      const operation = 'get';
      const key = 'leads:tenant1:page1';
      const hit = true;
      const duration = 5;
      const context = { tenantId: 'tenant1' };

      service.cacheOperation(operation, key, hit, duration, context);

      expect(mockLogger.info).toHaveBeenCalledWith(`Cache ${operation}`, {
        context: {
          ...context,
          cacheKey: key,
          cacheHit: hit,
        },
        performance: {
          operation: `cache_${operation}`,
          duration,
        },
      });
    });

    it('should log API requests', () => {
      const method = 'GET';
      const url = '/api/leads';
      const statusCode = 200;
      const duration = 120;
      const context = { tenantId: 'tenant1' };

      service.apiRequest(method, url, statusCode, duration, context);

      expect(mockLogger.http).toHaveBeenCalledWith(`${method} ${url} ${statusCode}`, {
        context: {
          ...context,
          method,
          url,
          statusCode,
        },
        performance: {
          operation: 'api_request',
          duration,
        },
      });
    });

    it('should log business events', () => {
      const event = 'lead_created';
      const data = { leadId: 'lead123', source: 'website' };
      const context = { tenantId: 'tenant1' };

      service.businessEvent(event, data, context);

      expect(mockLogger.info).toHaveBeenCalledWith(`Business event: ${event}`, {
        context: {
          ...context,
          event,
          eventData: data,
        },
      });
    });

    it('should log security events', () => {
      const event = 'failed_login_attempt';
      const severity = 'medium';
      const context = { ip: '192.168.1.1', userAgent: 'test-agent' };

      service.securityEvent(event, severity, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(`Security event: ${event}`, {
        context: {
          ...context,
          securityEvent: event,
          severity,
        },
      });
    });
  });

  describe('utility methods', () => {
    it('should sanitize SQL queries', () => {
      const query = "SELECT * FROM users WHERE password = 'secret123' AND token = 'abc123'";
      const sanitized = service['sanitizeQuery'](query);

      expect(sanitized).toContain("password='***'");
      expect(sanitized).toContain("token='***'");
      expect(sanitized).not.toContain('secret123');
      expect(sanitized).not.toContain('abc123');
    });

    it('should sanitize URLs', () => {
      const url = '/api/users?password=secret&token=abc123&name=john';
      const sanitized = service['sanitizeUrl'](url);

      expect(sanitized).toContain('password=***');
      expect(sanitized).toContain('token=***');
      expect(sanitized).toContain('name=john');
      expect(sanitized).not.toContain('secret');
      expect(sanitized).not.toContain('abc123');
    });

    it('should handle URL sanitization errors gracefully', () => {
      const invalidUrl = 'not-a-valid-url?password=secret';
      const sanitized = service['sanitizeUrl'](invalidUrl);

      expect(sanitized).toContain('password=***');
      expect(sanitized).not.toContain('secret');
    });

    it('should get log level', () => {
      const level = service.getLogLevel();
      expect(level).toBe('info');
    });

    it('should set log level', () => {
      service.setLogLevel(LogLevel.DEBUG);
      expect(mockLogger.level).toBe(LogLevel.DEBUG);
    });

    it('should check if level is enabled', () => {
      const isEnabled = service.isLevelEnabled(LogLevel.INFO);
      expect(isEnabled).toBe(true);
      expect(mockLogger.isLevelEnabled).toHaveBeenCalledWith(LogLevel.INFO);
    });

    it('should get logger statistics', () => {
      const stats = service.getStats();
      
      expect(stats).toEqual({
        level: 'info',
        transports: 0,
        service: expect.any(String),
        environment: expect.any(String),
      });
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional context', () => {
      const parentContext = { tenantId: 'tenant1' };
      const childContext = { userId: 'user1' };

      service.setContext(parentContext);
      const childLogger = service.child(childContext);

      expect(childLogger).toBeInstanceOf(StructuredLoggerService);
      
      // Child should have both parent and child context
      const combinedContext = childLogger.getContextualData();
      expect(combinedContext).toEqual(expect.objectContaining({
        ...parentContext,
        ...childContext,
      }));
    });
  });

  describe('error formatting', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      error.name = 'TestError';
      (error as any).code = 'TEST_CODE';

      const formatted = service['formatError'](error);

      expect(formatted).toEqual({
        name: 'TestError',
        message: 'Test error',
        stack: error.stack,
        code: 'TEST_CODE',
      });
    });

    it('should format string errors', () => {
      const error = 'String error message';
      const formatted = service['formatError'](error);

      expect(formatted).toEqual({
        message: error,
      });
    });

    it('should handle undefined errors', () => {
      const formatted = service['formatError'](undefined);
      expect(formatted).toBeUndefined();
    });
  });
});