#!/usr/bin/env node
/**
 * Validation script to verify all monorepo optimizations work correctly
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../packages/shared/dist/logging/index.js';

const logger = createLogger('validate-setup');

const VALIDATION_TESTS = [
  {
    name: 'Dependencies Installation',
    test: () => {
      execSync('pnpm install --frozen-lockfile', { stdio: 'pipe' });
      return true;
    }
  },
  {
    name: 'Shared Packages Build',
    test: () => {
      execSync('pnpm -r --filter "@tekup/*" build', { stdio: 'pipe' });
      return true;
    }
  },
  {
    name: 'Logging Infrastructure',
    test: () => {
      const sharedIndex = readFileSync('packages/shared/dist/index.js', 'utf8');
      return sharedIndex.includes('createLogger');
    }
  },
  {
    name: 'ESLint Configuration',
    test: () => {
      execSync('pnpm lint --max-warnings=0', { stdio: 'pipe' });
      return true;
    }
  },
  {
    name: 'TypeScript Build',
    test: () => {
      execSync('pnpm typecheck', { stdio: 'pipe' });
      return true;
    }
  },
  {
    name: 'Jest Configuration',
    test: () => {
      execSync('pnpm test --passWithNoTests', { stdio: 'pipe' });
      return true;
    }
  },
  {
    name: 'NX Workspace',
    test: () => {
      const nxConfig = JSON.parse(readFileSync('nx.json', 'utf8'));
      return nxConfig.plugins && nxConfig.targetDefaults;
    }
  },
  {
    name: 'Changesets Configuration',
    test: () => {
      const changesetConfig = JSON.parse(readFileSync('.changeset/config.json', 'utf8'));
      return changesetConfig.changelog && changesetConfig.changelog[0] === '@changesets/changelog-github';
    }
  },
  {
    name: 'Documentation Build',
    test: () => {
      execSync('pnpm -C docs build', { stdio: 'pipe' });
      return existsSync('docs/build');
    }
  },
  {
    name: 'Docker Optimization',
    test: () => {
      return existsSync('apps/flow-api/Dockerfile.optimized') && 
             existsSync('apps/tekup-crm-api/Dockerfile.optimized');
    }
  },
  {
    name: 'Monitoring Configuration',
    test: () => {
      return existsSync('monitoring/prometheus.yml') && 
             existsSync('monitoring/grafana/provisioning/datasources/prometheus.yml');
    }
  },
  {
    name: 'CI/CD Pipeline',
    test: () => {
      const ciConfig = readFileSync('.github/workflows/ci.yml', 'utf8');
      const releaseConfig = readFileSync('.github/workflows/release.yml', 'utf8');
      return ciConfig.includes('nx affected') && releaseConfig.includes('changesets/action');
    }
  }
];

async function runValidation() {
  logger.info('🧪 Starting TekUp Monorepo Validation...');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of VALIDATION_TESTS) {
    try {
      logger.info(`Testing: ${test.name}`);
      const result = await test.test();
      
      if (result) {
        logger.info(`✅ ${test.name} - PASSED`);
        passed++;
      } else {
        logger.error(`❌ ${test.name} - FAILED`);
        failed++;
      }
    } catch (error) {
      logger.error(`❌ ${test.name} - ERROR: ${error.message}`);
      failed++;
    }
  }
  
  logger.info(`\n📊 Validation Results:`);
  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    logger.info('🎉 All validations passed! Monorepo is ready for production.');
  } else {
    logger.error('🚨 Some validations failed. Please check the issues above.');
    process.exit(1);
  }
}

runValidation().catch(error => {
  logger.error('Validation script failed:', error);
  process.exit(1);
});
