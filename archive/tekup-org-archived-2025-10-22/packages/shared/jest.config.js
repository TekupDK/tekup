/** @type {import('jest').Config} */
module.exports = {
  displayName: '@tekup/shared',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.{ts,js}'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
  ],
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.js'],
};
