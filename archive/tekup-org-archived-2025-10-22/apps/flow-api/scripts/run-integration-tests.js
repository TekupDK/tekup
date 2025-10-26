#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-scripts-run-inte');


const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  logger.info(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.blue}▶ ${description}${colors.reset}`);
  log(`${colors.cyan}Running: ${command}${colors.reset}`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    log(`${colors.green}✓ ${description} completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}✗ ${description} failed${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

function checkPrerequisites() {
  log(`${colors.bright}Checking prerequisites...${colors.reset}`);
  
  // Check if test database URL is configured
  if (!process.env.PX_DATABASE_URL && !existsSync('.env.test')) {
    log(`${colors.yellow}⚠ Warning: No test database configuration found${colors.reset}`);
    log(`${colors.yellow}  Please create .env.test with PX_DATABASE_URL${colors.reset}`);
  }
  
  // Check if Redis is available (optional)
  try {
    execSync('redis-cli ping', { stdio: 'pipe' });
    log(`${colors.green}✓ Redis is available${colors.reset}`);
  } catch {
    log(`${colors.yellow}⚠ Warning: Redis not available - some tests may fail${colors.reset}`);
  }
  
  // Check if PostgreSQL is available
  try {
    execSync('pg_isready', { stdio: 'pipe' });
    log(`${colors.green}✓ PostgreSQL is available${colors.reset}`);
  } catch {
    log(`${colors.yellow}⚠ Warning: PostgreSQL not available - database tests may fail${colors.reset}`);
  }
}

function main() {
  log(`${colors.bright}${colors.magenta}🚀 Running API Improvements Integration Tests${colors.reset}`);
  
  checkPrerequisites();
  
  const testSuites = [
    {
      name: 'Unit Tests',
      command: 'npm test',
      description: 'Running unit tests',
    },
    {
      name: 'Integration Tests',
      command: 'npm run test:e2e -- --testPathPattern=integration',
      description: 'Running integration tests',
    },
    {
      name: 'Performance Tests',
      command: 'npm run test:e2e -- --testPathPattern=performance',
      description: 'Running performance tests',
    },
    {
      name: 'WebSocket Tests',
      command: 'npm run test:e2e -- --testPathPattern=websocket',
      description: 'Running WebSocket tests',
    },
  ];
  
  const results = [];
  
  for (const suite of testSuites) {
    const success = runCommand(suite.command, suite.description);
    results.push({ name: suite.name, success });
  }
  
  // Summary
  log(`\n${colors.bright}${colors.magenta}📊 Test Results Summary${colors.reset}`);
  log('═'.repeat(50));
  
  let allPassed = true;
  for (const result of results) {
    const status = result.success ? 
      `${colors.green}✓ PASSED${colors.reset}` : 
      `${colors.red}✗ FAILED${colors.reset}`;
    log(`${result.name.padEnd(20)} ${status}`);
    if (!result.success) allPassed = false;
  }
  
  log('═'.repeat(50));
  
  if (allPassed) {
    log(`${colors.green}${colors.bright}🎉 All tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    log(`${colors.red}${colors.bright}❌ Some tests failed${colors.reset}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bright}API Improvements Integration Test Runner${colors.reset}`);
  log('');
  log('Usage: node scripts/run-integration-tests.js [options]');
  log('');
  log('Options:');
  log('  --help, -h     Show this help message');
  log('  --unit         Run only unit tests');
  log('  --integration  Run only integration tests');
  log('  --performance  Run only performance tests');
  log('  --websocket    Run only WebSocket tests');
  log('');
  log('Environment:');
  log('  Ensure .env.test is configured with test database settings');
  log('  Redis and PostgreSQL should be running for full test coverage');
  process.exit(0);
}

// Run specific test suites based on arguments
if (args.length > 0) {
  const testMap = {
    '--unit': 'npm test',
    '--integration': 'npm run test:e2e -- --testPathPattern=integration',
    '--performance': 'npm run test:e2e -- --testPathPattern=performance',
    '--websocket': 'npm run test:e2e -- --testPathPattern=websocket',
  };
  
  for (const arg of args) {
    if (testMap[arg]) {
      const description = `Running ${arg.replace('--', '')} tests`;
      runCommand(testMap[arg], description);
    }
  }
} else {
  main();
}