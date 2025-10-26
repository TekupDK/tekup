/** @type {import('jest').Config} */
module.exports = {
  displayName: 'TekUp Monorepo',
  projects: [
    // Apps
    '<rootDir>/apps/*/jest.config.js',
    // Packages  
    '<rootDir>/packages/*/jest.config.js',
    // Root integration tests
    {
      displayName: 'integration-tests',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    }
  ],
  collectCoverageFrom: [
    'apps/**/*.{ts,tsx,js,jsx}',
    'packages/**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.test.*',
    '!**/*.spec.*',
    '!**/coverage/**',
    '!**/.next/**',
  ],
  coverageReporters: ['text', 'json', 'html', 'lcov'],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  moduleNameMapping: {
    '^@tekup/(.*)$': '<rootDir>/packages/$1/src',
  },
};
