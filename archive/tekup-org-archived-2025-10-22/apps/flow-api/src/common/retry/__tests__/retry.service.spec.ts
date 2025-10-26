import { Test, TestingModule } from '@nestjs/testing';
import { RetryService, RetryableError, NonRetryableError } from '../retry.service.js';
import { StructuredLoggerService } from '../../logging/structured-logger.service.js';

describe('RetryService', () => {
  let service: RetryService;
  let mockLogger: jest.Mocked<StructuredLoggerService>;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryService,
        { provide: StructuredLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RetryService>(RetryService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await service.executeWithRetry(mockOperation);

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new RetryableError('Temporary failure'))
        .mockRejectedValueOnce(new RetryableError('Another failure'))
        .mockResolvedValue('success');

      const result = await service.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 10, // Short delay for testing
      });

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
      expect(result.errors).toHaveLength(2);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new NonRetryableError('Permanent failure'));

      await expect(
        service.executeWithRetry(mockOperation, { maxRetries: 3 })
      ).rejects.toThrow('Permanent failure');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries limit', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new RetryableError('Always fails'));

      await expect(
        service.executeWithRetry(mockOperation, {
          maxRetries: 2,
          baseDelay: 10,
        })
      ).rejects.toThrow('Always fails');

      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use custom retry condition', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Custom error'));
      const customRetryCondition = jest.fn().mockReturnValue(true);

      await expect(
        service.executeWithRetry(mockOperation, {
          maxRetries: 1,
          baseDelay: 10,
          retryCondition: customRetryCondition,
        })
      ).rejects.toThrow('Custom error');

      expect(customRetryCondition).toHaveBeenCalledWith(expect.any(Error), 1);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new RetryableError('Failure'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      await service.executeWithRetry(mockOperation, {
        maxRetries: 1,
        baseDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledWith(
        expect.any(RetryableError),
        1,
        expect.any(Number)
      );
    });

    it('should handle timeout', async () => {
      const mockOperation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(
        service.executeWithRetry(mockOperation, {
          timeout: 50,
          maxRetries: 0,
        })
      ).rejects.toThrow('Operation timed out after 50ms');
    });
  });

  describe('withRetry', () => {
    it('should create retryable function', async () => {
      const originalFn = jest.fn().mockResolvedValue('result');
      const retryableFn = service.withRetry(originalFn, { maxRetries: 2 });

      const result = await retryableFn('arg1', 'arg2');

      expect(result).toBe('result');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should retry wrapped function', async () => {
      const originalFn = jest.fn()
        .mockRejectedValueOnce(new RetryableError('Failure'))
        .mockResolvedValue('success');

      const retryableFn = service.withRetry(originalFn, {
        maxRetries: 1,
        baseDelay: 10,
      });

      const result = await retryableFn();

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('default retry condition', () => {
    it('should retry network errors', () => {
      const networkError = new Error('Connection refused');
      networkError.name = 'NetworkError';
      (networkError as any).code = 'ECONNREFUSED';

      const shouldRetry = service['defaultRetryCondition'](networkError, 1);
      expect(shouldRetry).toBe(true);
    });

    it('should retry timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';

      const shouldRetry = service['defaultRetryCondition'](timeoutError, 1);
      expect(shouldRetry).toBe(true);
    });

    it('should retry database connection errors', () => {
      const dbError = new Error('Connection terminated');
      (dbError as any).code = 'P1001';

      const shouldRetry = service['defaultRetryCondition'](dbError, 1);
      expect(shouldRetry).toBe(true);
    });

    it('should retry server errors', () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;

      const shouldRetry = service['defaultRetryCondition'](serverError, 1);
      expect(shouldRetry).toBe(true);
    });

    it('should retry rate limit errors', () => {
      const rateLimitError = new Error('Too many requests');
      (rateLimitError as any).status = 429;

      const shouldRetry = service['defaultRetryCondition'](rateLimitError, 1);
      expect(shouldRetry).toBe(true);
    });

    it('should not retry client errors', () => {
      const clientError = new Error('Bad request');
      (clientError as any).status = 400;

      const shouldRetry = service['defaultRetryCondition'](clientError, 1);
      expect(shouldRetry).toBe(false);
    });
  });

  describe('delay calculation', () => {
    it('should calculate linear backoff', () => {
      const delay1 = service['calculateDelay'](1, 1000, 10000, 'linear', false);
      const delay2 = service['calculateDelay'](2, 1000, 10000, 'linear', false);
      const delay3 = service['calculateDelay'](3, 1000, 10000, 'linear', false);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(3000);
    });

    it('should calculate exponential backoff', () => {
      const delay1 = service['calculateDelay'](1, 1000, 10000, 'exponential', false);
      const delay2 = service['calculateDelay'](2, 1000, 10000, 'exponential', false);
      const delay3 = service['calculateDelay'](3, 1000, 10000, 'exponential', false);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
    });

    it('should calculate fixed backoff', () => {
      const delay1 = service['calculateDelay'](1, 1000, 10000, 'fixed', false);
      const delay2 = service['calculateDelay'](2, 1000, 10000, 'fixed', false);
      const delay3 = service['calculateDelay'](3, 1000, 10000, 'fixed', false);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(1000);
      expect(delay3).toBe(1000);
    });

    it('should respect max delay', () => {
      const delay = service['calculateDelay'](10, 1000, 5000, 'exponential', false);
      expect(delay).toBe(5000);
    });

    it('should add jitter when enabled', () => {
      const delay1 = service['calculateDelay'](2, 1000, 10000, 'exponential', true);
      const delay2 = service['calculateDelay'](2, 1000, 10000, 'exponential', true);

      // With jitter, delays should be different (with high probability)
      // Base delay is 2000, jitter is ±200, so range is 1800-2200
      expect(delay1).toBeGreaterThanOrEqual(1800);
      expect(delay1).toBeLessThanOrEqual(2200);
      expect(delay2).toBeGreaterThanOrEqual(1800);
      expect(delay2).toBeLessThanOrEqual(2200);
    });
  });

  describe('error type detection', () => {
    it('should detect network errors', () => {
      const networkError = new Error('Connection refused');
      (networkError as any).code = 'ECONNREFUSED';

      expect(service['isNetworkError'](networkError)).toBe(true);
    });

    it('should detect timeout errors', () => {
      const timeoutError = new Error('Operation timed out');
      expect(service['isTimeoutError'](timeoutError)).toBe(true);
    });

    it('should detect database connection errors', () => {
      const dbError = new Error('Connection terminated');
      (dbError as any).code = 'P1001';

      expect(service['isDatabaseConnectionError'](dbError)).toBe(true);
    });

    it('should detect server errors', () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;

      expect(service['isServerError'](serverError)).toBe(true);
    });

    it('should detect rate limit errors', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      expect(service['isRateLimitError'](rateLimitError)).toBe(true);
    });
  });

  describe('static retry options', () => {
    it('should provide database retry options', () => {
      const options = RetryService.databaseRetryOptions();

      expect(options.maxRetries).toBe(3);
      expect(options.backoffStrategy).toBe('exponential');
      expect(options.jitter).toBe(true);
      expect(options.retryCondition).toBeDefined();
    });

    it('should provide HTTP retry options', () => {
      const options = RetryService.httpRetryOptions();

      expect(options.maxRetries).toBe(3);
      expect(options.backoffStrategy).toBe('exponential');
      expect(options.jitter).toBe(true);
      expect(options.retryCondition).toBeDefined();
    });

    it('should provide external API retry options', () => {
      const options = RetryService.externalApiRetryOptions();

      expect(options.maxRetries).toBe(5);
      expect(options.timeout).toBe(30000);
      expect(options.backoffStrategy).toBe('exponential');
      expect(options.retryCondition).toBeDefined();
    });
  });

  describe('logging', () => {
    it('should log successful retry', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new RetryableError('Failure'))
        .mockResolvedValue('success');

      await service.executeWithRetry(mockOperation, {
        maxRetries: 1,
        baseDelay: 10,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Operation succeeded after retries',
        expect.objectContaining({
          attempts: 2,
          operation: 'mockConstructor',
        })
      );
    });

    it('should log retry attempts', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new RetryableError('Failure'))
        .mockResolvedValue('success');

      await service.executeWithRetry(mockOperation, {
        maxRetries: 1,
        baseDelay: 10,
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed, retrying'),
        expect.objectContaining({
          attempt: 1,
          maxRetries: 1,
          error: 'Failure',
        })
      );
    });

    it('should log final failure', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new RetryableError('Always fails'));

      await expect(
        service.executeWithRetry(mockOperation, {
          maxRetries: 1,
          baseDelay: 10,
        })
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Operation failed after all retries',
        expect.any(RetryableError),
        expect.objectContaining({
          attempts: 2,
          maxRetries: 1,
          finalError: 'Always fails',
        })
      );
    });
  });
});