import { createLogger } from '../logging/logger';

describe('Logger', () => {
  let mockConsole: jest.SpyInstance;

  beforeEach(() => {
    mockConsole = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    mockConsole.mockRestore();
  });

  it('should create logger with service name', () => {
    const logger = createLogger('test-service');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  it('should log info messages with correct format', () => {
    const logger = createLogger('test-service');
    logger.info('test message');
    
    expect(mockConsole).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[test-service\] test message/)
    );
  });

  it('should include context in log messages', () => {
    const logger = createLogger('test-service');
    logger.info('test message', { userId: '123', action: 'login' });
    
    expect(mockConsole).toHaveBeenCalledWith(
      expect.stringMatching(/test message {"userId":"123","action":"login"}/)
    );
  });

  it('should respect log level filtering', () => {
    const logger = createLogger('test-service', 'error');
    logger.info('info message');
    logger.error('error message');
    
    expect(mockConsole).not.toHaveBeenCalledWith(
      expect.stringContaining('info message')
    );
  });
});
