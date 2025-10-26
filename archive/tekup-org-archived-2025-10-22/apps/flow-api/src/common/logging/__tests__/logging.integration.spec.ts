import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { StructuredLoggerService } from '../structured-logger.service.js';
import { LoggingModule } from '../logging.module.js';
import request from 'supertest';

describe('Logging Integration', () => {
  let app: INestApplication;
  let logger: StructuredLoggerService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LoggingModule],
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    logger = moduleFixture.get<StructuredLoggerService>(StructuredLoggerService);
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should add correlation ID to requests', async () => {
    const correlationId = 'test-correlation-id';
    
    const response = await request(app.getHttpServer())
      .get('/test')
      .set('X-Correlation-ID', correlationId)
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe(correlationId);
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('should generate correlation ID when none provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/test')
      .expect(200);

    expect(response.headers['x-correlation-id']).toBeDefined();
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('should maintain context across async operations', (done) => {
    const testContext = { tenantId: 'test-tenant', userId: 'test-user' };
    
    logger.runWithContext(testContext, async () => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const context = logger.getContextualData();
      expect(context).toEqual(expect.objectContaining(testContext));
      done();
    });
  });

  it('should log performance metrics correctly', () => {
    const operation = 'test_operation';
    const duration = 150;
    const context = { component: 'test' };

    const logSpy = jest.spyOn(logger['logger'], 'info');
    
    logger.performance(operation, duration, context);

    expect(logSpy).toHaveBeenCalledWith(`Performance: ${operation}`, {
      context,
      performance: {
        operation,
        duration,
      },
    });
  });

  it('should sanitize sensitive data in logs', () => {
    const query = "SELECT * FROM users WHERE password = 'secret123'";
    const sanitized = logger['sanitizeQuery'](query);

    expect(sanitized).toContain("password='***'");
    expect(sanitized).not.toContain('secret123');
  });

  it('should create child loggers with inherited context', () => {
    const parentContext = { tenantId: 'tenant1' };
    const childContext = { userId: 'user1' };

    logger.setContext(parentContext);
    const childLogger = logger.child(childContext);

    const combinedContext = childLogger.getContextualData();
    expect(combinedContext).toEqual(expect.objectContaining({
      ...parentContext,
      ...childContext,
    }));
  });

  it('should handle different log levels', () => {
    const message = 'Test message';
    const context = { test: true };

    const errorSpy = jest.spyOn(logger['logger'], 'error');
    const warnSpy = jest.spyOn(logger['logger'], 'warn');
    const infoSpy = jest.spyOn(logger['logger'], 'info');
    const debugSpy = jest.spyOn(logger['logger'], 'debug');

    logger.error(message, new Error('test error'), context);
    logger.warn(message, context);
    logger.info(message, context);
    logger.debug(message, context);

    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalled();
  });

  it('should log business events with proper structure', () => {
    const event = 'user_registered';
    const data = { userId: 'user123', email: 'test@example.com' };
    const context = { tenantId: 'tenant1' };

    const logSpy = jest.spyOn(logger['logger'], 'info');

    logger.businessEvent(event, data, context);

    expect(logSpy).toHaveBeenCalledWith(`Business event: ${event}`, {
      context: {
        ...context,
        event,
        eventData: data,
      },
    });
  });

  it('should log security events with severity', () => {
    const event = 'failed_login';
    const severity = 'medium';
    const context = { ip: '192.168.1.1' };

    const logSpy = jest.spyOn(logger['logger'], 'warn');

    logger.securityEvent(event, severity, context);

    expect(logSpy).toHaveBeenCalledWith(`Security event: ${event}`, {
      context: {
        ...context,
        securityEvent: event,
        severity,
      },
    });
  });
});

// Test controller for integration tests
import { Controller, Get } from '@nestjs/common';

@Controller('test')
class TestController {
  @Get()
  test() {
    return { message: 'test' };
  }
}