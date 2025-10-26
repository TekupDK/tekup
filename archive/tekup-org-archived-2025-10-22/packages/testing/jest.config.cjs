const base = require('../../jest.base.config.cjs');

module.exports = {
  ...base,
  displayName: '@tekup/testing',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/config/**',
    '!src/mocks/**', // TODO: Remove mocks directory in favor of real services
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 30000,
};
