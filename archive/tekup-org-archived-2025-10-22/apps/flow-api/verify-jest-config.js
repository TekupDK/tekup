// Simple script to verify Jest configuration
const fs = require('fs');
const path = require('path');

// Check if jest.config.cjs exists
const jestConfigPath = path.join(__dirname, 'jest.config.cjs');
logger.info('Looking for Jest config at:', jestConfigPath);

if (fs.existsSync(jestConfigPath)) {
  logger.info('✓ Jest config file exists');
  try {
    const config = require('./jest.config.cjs');
    logger.info('✓ Jest config loaded successfully');
    logger.info('Config:', JSON.stringify(config, null, 2));
  } catch (error) {
    logger.info('✗ Error loading Jest config:', error.message);
  }
} else {
  logger.info('✗ Jest config file does not exist');
}

// Check if ts-jest is installed
try {
  require.resolve('ts-jest');
  logger.info('✓ ts-jest is installed');
} catch (error) {
  logger.info('✗ ts-jest is not installed:', error.message);
}