/**
 * Jest Test Setup
 * Configures global test environment, mocks, and utilities
 */
import 'reflect-metadata';

// Mock environment variables for testing (must be set before any imports)
Object.assign(process.env, {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-jwt-secret-for-unit-tests-only-min-32-chars-long',
  JWT_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  ENCRYPTION_KEY: 'test-encryption-key-for-tests-only-32chars-long',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db?schema=renos',
  BCRYPT_ROUNDS: '4',
  LOG_LEVEL: 'error',
  ENABLE_SWAGGER: 'false',
  SENTRY_DSN: '',
});

// Suppress console output in tests
const noop = () => {};
global.console.log = noop;
global.console.debug = noop;
global.console.info = noop;