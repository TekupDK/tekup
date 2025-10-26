import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock external services if needed
jest.setTimeout(60000); // 60 second timeout for integration tests

// Global test utilities
global.testUtils = {
  generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  retryUntil: async (fn: () => Promise<boolean>, maxAttempts = 10, delay = 100) => {
    for (let i = 0; i < maxAttempts; i++) {
      if (await fn()) {
        return true;
      }
      await global.testUtils.waitFor(delay);
    }
    return false;
  },
};

// Extend Jest matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Declare global types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
  
  var testUtils: {
    generateTestId: () => string;
    waitFor: (ms: number) => Promise<void>;
    retryUntil: (fn: () => Promise<boolean>, maxAttempts?: number, delay?: number) => Promise<boolean>;
  };
}