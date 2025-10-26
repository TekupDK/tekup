// Test script to verify Jest configuration
import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-test-jest-config');


const execAsync = promisify(exec);

async function testJestConfig() {
  try {
    logger.info('Testing Jest configuration...');
    
    // Run a simple Jest test to verify configuration
    const { stdout, stderr } = await execAsync('npx jest --dryRun --passWithNoTests', {
      cwd: process.cwd() + '/apps/flow-api'
    });
    
    logger.info('Jest configuration test passed!');
    logger.info('stdout:', stdout);
    if (stderr) logger.info('stderr:', stderr);
    
  } catch (error) {
    logger.error('Jest configuration test failed:');
    logger.error(error.message);
  }
}

testJestConfig();