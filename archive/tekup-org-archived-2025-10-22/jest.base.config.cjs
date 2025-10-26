const path = require('path');

module.exports = {
  // Keep rootDir per-package; use absolute paths for shared files
  rootDir: process.cwd(),
  testEnvironment: 'node', // packages can override to 'jsdom' for frontend
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        target: 'es2021',
        parser: { syntax: 'typescript', tsx: true },
        transform: { react: { runtime: 'automatic' } }
      },
      module: { type: 'commonjs' }
    }]
  },
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: [path.resolve(__dirname, 'testing/jest.setup.ts')],
  testSequencer: path.resolve(__dirname, 'testing/jest.sequencer.cjs'),
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: path.resolve(__dirname, 'reports/junit'), outputName: 'junit.xml' }]
  ],
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  coverageDirectory: path.resolve(__dirname, 'reports/coverage'),
  maxWorkers: process.env.JEST_MAX_WORKERS || '50%',
  testTimeout: 30000,
  verbose: true,
  cacheDirectory: path.resolve(__dirname, '.jest-cache')
};
