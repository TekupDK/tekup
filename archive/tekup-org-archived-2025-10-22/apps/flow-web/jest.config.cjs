const nextJest = require('next/jest');
const base = require('../../jest.base.config.cjs');

const createJestConfig = nextJest({
  dir: './',
});

// Merge our base config with Next.js specific config
const customJestConfig = {
  ...base,
  displayName: '@tekup/flow-web',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/index.{js,jsx,ts,tsx}',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/**/*.test.{js,jsx,ts,tsx}',
    '!app/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/app/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/app/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);
