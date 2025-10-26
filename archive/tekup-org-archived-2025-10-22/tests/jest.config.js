const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig.base.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.ts'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../' }),
    '^@/(.*)$': '<rootDir>/../apps/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/unit/**/*.test.ts',
    '<rootDir>/unit/**/*.test.tsx',
    '<rootDir>/integration/**/*.test.ts',
    '<rootDir>/api/**/*.test.ts'
  ],
  collectCoverageFrom: [
    '../apps/**/src/**/*.{ts,tsx}',
    '../packages/**/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/.next/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  projects: [
    {
      displayName: 'FoodTruck OS Backend',
      testMatch: ['<rootDir>/unit/foodtruck-os-backend/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'FoodTruck OS Frontend',
      testMatch: ['<rootDir>/unit/foodtruck-os-frontend/**/*.test.tsx'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'RendetaljeOS Backend',
      testMatch: ['<rootDir>/unit/rendetalje-os-backend/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'RendetaljeOS Frontend',
      testMatch: ['<rootDir>/unit/rendetalje-os-frontend/**/*.test.tsx'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'EssenzaPro Backend',
      testMatch: ['<rootDir>/unit/essenza-pro-backend/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'EssenzaPro Frontend',
      testMatch: ['<rootDir>/unit/essenza-pro-frontend/**/*.test.tsx'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'MCP Studio Backend',
      testMatch: ['<rootDir>/unit/mcp-studio-backend/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'MCP Studio Frontend',
      testMatch: ['<rootDir>/unit/mcp-studio-frontend/**/*.test.tsx'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'API Tests',
      testMatch: ['<rootDir>/api/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/integration/**/*.test.ts'],
      testEnvironment: 'node'
    }
  ]
};
