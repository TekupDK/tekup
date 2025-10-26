#!/usr/bin/env node

/**
 * Production start script with automatic preload script patching
 * This sets up the environment for Claude Code OAuth credential interception
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-backend-script');


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up environment variables for preload script patching
const env = {
  ...process.env,
  NODE_OPTIONS: '--require ./dist/auth/preload-script.cjs',
  CLAUDE_CREDENTIALS_PATH: join(process.env.HOME || process.cwd(), '.claude-credentials.json'),
  DEBUG_PRELOAD_SCRIPT: process.env.DEBUG_PRELOAD_SCRIPT || '0'
};

logger.info('🚀 Starting backend with Claude OAuth preload script patching...');
logger.info('📁 Preload script:', './dist/auth/preload-script.cjs');
logger.info('🗄️ Credentials path:', env.CLAUDE_CREDENTIALS_PATH);
logger.info('🐛 Debug logging:', env.DEBUG_PRELOAD_SCRIPT === '1' ? 'enabled' : 'disabled');
logger.info('');

// Start the production server
const child = spawn('node', ['dist/cli/node.js'], {
  env,
  stdio: 'inherit',
  shell: false
});

child.on('error', (error) => {
  logger.error('❌ Failed to start production server:', error);
  process.exit(1);
});

child.on('close', (code) => {
  logger.info(`\n🛑 Production server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  logger.info('\n🛑 Shutting down production server...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  logger.info('\n🛑 Shutting down production server...');
  child.kill('SIGTERM');
});