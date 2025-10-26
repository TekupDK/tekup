import type { Config } from '@jest/types';

export interface JestConfigOptions {
  testEnvironment?: 'node' | 'jsdom';
  setupFilesAfterEnv?: string[];
  testMatch?: string[];
  collectCoverageFrom?: string[];
  coverageThreshold?: {
    global: {
      branches: number;
      functions: number;
      lines: number;
      statements: number;
    };
  };
  testTimeout?: number;
  maxWorkers?: number;
}

export function createJestConfig(options: JestConfigOptions = {}): Config.InitialOptions {
  const defaultOptions: JestConfigOptions = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/src/config/jest-setup.ts'],
    testMatch: [
      '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
      '**/*.(test|spec).(ts|tsx|js)',
    ],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.test.{ts,tsx}',
      '!src/**/*.spec.{ts,tsx}',
      '!src/config/**',
      '!src/mocks/**',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    testTimeout: 30000,
    maxWorkers: '50%',
  };

  const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: defaultOptions.testEnvironment,
    roots: ['<rootDir>/src'],
    setupFilesAfterEnv: defaultOptions.setupFilesAfterEnv,
    testMatch: defaultOptions.testMatch,
    transform: {
      '^.+\\.(ts|tsx)$': [
        'ts-jest',
        {
          tsconfig: '<rootDir>/tsconfig.json',
          useESM: true,
        },
      ],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
      '^@tekup/(.*)$': '<rootDir>/../$1/src',
    },
    transformIgnorePatterns: [
      '/node_modules/(?!(@nestjs|uuid|faker|testcontainers)/)',
    ],
    collectCoverageFrom: defaultOptions.collectCoverageFrom,
    coverageThreshold: defaultOptions.coverageThreshold,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    testTimeout: defaultOptions.testTimeout,
    maxWorkers: defaultOptions.maxWorkers,
    verbose: true,
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
    globals: {
      'ts-jest': {
        useESM: true,
      },
    },
    // Multi-tenant testing configuration
    testEnvironmentOptions: {
      url: 'http://localhost:4000',
      customExportConditions: ['node', 'node-addons'],
    },
    // AI agent testing configuration
    setupFilesAfterEnv: [
      ...(defaultOptions.setupFilesAfterEnv || []),
      '<rootDir>/src/config/ai-agent-setup.ts',
    ],
    // Business-specific test configuration
    projects: [
      {
        displayName: 'unit',
        testMatch: ['**/*.unit.test.ts', '**/*.unit.spec.ts'],
        testEnvironment: 'node',
      },
      {
        displayName: 'integration',
        testMatch: ['**/*.integration.test.ts', '**/*.integration.spec.ts'],
        testEnvironment: 'node',
        setupFilesAfterEnv: [
          '<rootDir>/src/config/integration-setup.ts',
        ],
      },
      {
        displayName: 'e2e',
        testMatch: ['**/*.e2e.test.ts', '**/*.e2e.spec.ts'],
        testEnvironment: 'node',
        setupFilesAfterEnv: [
          '<rootDir>/src/config/e2e-setup.ts',
        ],
        testTimeout: 60000,
      },
      {
        displayName: 'voice-agent',
        testMatch: ['**/agents/**/*.test.ts', '**/agents/**/*.spec.ts'],
        testEnvironment: 'node',
        setupFilesAfterEnv: [
          '<rootDir>/src/config/voice-agent-setup.ts',
        ],
      },
      {
        displayName: 'business-suites',
        testMatch: ['**/suites/**/*.test.ts', '**/suites/**/*.spec.ts'],
        testEnvironment: 'node',
        setupFilesAfterEnv: [
          '<rootDir>/src/config/business-setup.ts',
        ],
      },
      {
        displayName: 'performance',
        testMatch: ['**/performance/**/*.test.ts', '**/performance/**/*.spec.ts'],
        testEnvironment: 'node',
        setupFilesAfterEnv: [
          '<rootDir>/src/config/performance-setup.ts',
        ],
        testTimeout: 120000,
      },
    ],
  };

  return config;
}

// Specific configurations for different test types
export const jestConfigs = {
  // Unit testing configuration
  unit: createJestConfig({
    testEnvironment: 'node',
    testMatch: ['**/*.unit.test.ts', '**/*.unit.spec.ts'],
    coverageThreshold: {
      global: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  }),

  // Integration testing configuration
  integration: createJestConfig({
    testEnvironment: 'node',
    testMatch: ['**/*.integration.test.ts', '**/*.integration.spec.ts'],
    testTimeout: 45000,
    setupFilesAfterEnv: ['<rootDir>/src/config/integration-setup.ts'],
  }),

  // End-to-end testing configuration
  e2e: createJestConfig({
    testEnvironment: 'node',
    testMatch: ['**/*.e2e.test.ts', '**/*.e2e.spec.ts'],
    testTimeout: 60000,
    setupFilesAfterEnv: ['<rootDir>/src/config/e2e-setup.ts'],
    maxWorkers: 1, // E2E tests should run sequentially
  }),

  // Voice agent testing configuration
  voiceAgent: createJestConfig({
    testEnvironment: 'node',
    testMatch: ['**/agents/**/*.test.ts', '**/agents/**/*.spec.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/config/voice-agent-setup.ts'],
    testTimeout: 30000,
  }),

  // Business suite testing configuration
  businessSuite: createJestConfig({
    testEnvironment: 'node',
    testMatch: ['**/suites/**/*.test.ts', '**/suites/**/*.spec.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/config/business-setup.ts'],
    testTimeout: 45000,
  }),

  // Performance testing configuration
  performance: createJestConfig({
    testEnvironment: 'node',
    testMatch: ['**/performance/**/*.test.ts', '**/performance/**/*.spec.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/config/performance-setup.ts'],
    testTimeout: 120000,
    maxWorkers: 1, // Performance tests should run sequentially
  }),

  // Multi-tenant testing configuration
  multiTenant: createJestConfig({
    testEnvironment: 'node',
    testMatch: ['**/*.multi-tenant.test.ts', '**/*.multi-tenant.spec.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/config/multi-tenant-setup.ts'],
    testTimeout: 60000,
  }),
};

// Default configuration
export default createJestConfig();