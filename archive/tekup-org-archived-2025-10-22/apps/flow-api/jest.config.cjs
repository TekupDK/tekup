const base = require('../../jest.base.config.cjs');

module.exports = {
  ...base,
  displayName: '@tekup/flow-api',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@tekup/(.*)$': '<rootDir>/../../packages/$1/src',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@nestjs|uuid)/)'
  ],
};
