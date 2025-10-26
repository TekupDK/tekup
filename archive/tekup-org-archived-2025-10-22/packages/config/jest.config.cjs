const base = require('../../jest.base.config.cjs');

module.exports = {
  ...base,
  displayName: '@tekup/config',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
};
