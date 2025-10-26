// Global Jest setup for TekUp monorepo
import { createLogger } from '@tekup/shared';

// Setup logger for tests
global.testLogger = createLogger('test-runner');

// Global test utilities
global.testUtils = {
  // Helper to create mock data
  createMockUser: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@tekup.dk',
    name: 'Test User',
    tenantId: 'test-tenant',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Helper to create mock API responses
  createMockApiResponse: (data, status = 200) => ({
    status,
    data,
    headers: { 'content-type': 'application/json' },
    config: {},
    statusText: status === 200 ? 'OK' : 'Error'
  }),

  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/tekup_test';

// Suppress console output in tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
