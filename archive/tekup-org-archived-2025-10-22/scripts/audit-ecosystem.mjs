#!/usr/bin/env node
/**
 * TekUp Ecosystem Audit Script
 * Analyzes all apps for completeness, functionality, and integration
 */

import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../packages/shared/dist/logging/index.js';

const logger = createLogger('ecosystem-audit');

const APPS_DIR = 'apps';
const AUDIT_RESULTS = {
  complete: [],
  inProgress: [],
  skeleton: [],
  deprecated: []
};

async function auditEcosystem() {
  logger.info('🔍 Starting TekUp Ecosystem Audit...');
  
  const apps = readdirSync(APPS_DIR).filter(name => {
    return statSync(join(APPS_DIR, name)).isDirectory();
  });
  
  logger.info(`Found ${apps.length} applications to audit`);
  
  for (const appName of apps) {
    const result = await auditApplication(appName);
    categorizeApplication(appName, result);
  }
  
  generateAuditReport();
}

async function auditApplication(appName) {
  const appPath = join(APPS_DIR, appName);
  
  const audit = {
    name: appName,
    path: appPath,
    fileCount: countFiles(appPath),
    hasPackageJson: existsSync(join(appPath, 'package.json')),
    hasSource: false,
    hasTests: false,
    hasDatabase: false,
    hasDockerfile: false,
    hasReadme: false,
    dependencies: [],
    scripts: {},
    framework: 'unknown',
    status: 'unknown'
  };
  
  // Check package.json
  if (audit.hasPackageJson) {
    try {
      const pkg = JSON.parse(readFileSync(join(appPath, 'package.json'), 'utf8'));
      audit.dependencies = Object.keys(pkg.dependencies || {});
      audit.scripts = pkg.scripts || {};
      
      // Detect framework
      if (audit.dependencies.includes('@nestjs/core')) {
        audit.framework = 'NestJS (Backend)';
      } else if (audit.dependencies.includes('next')) {
        audit.framework = 'Next.js (Frontend)';
      } else if (audit.dependencies.includes('react-native')) {
        audit.framework = 'React Native (Mobile)';
      } else if (audit.dependencies.includes('electron')) {
        audit.framework = 'Electron (Desktop)';
      } else if (audit.dependencies.includes('react')) {
        audit.framework = 'React (Web)';
      }
    } catch (error) {
      logger.error(`Failed to parse package.json for ${appName}:`, error.message);
    }
  }
  
  // Check for source code
  const srcPaths = ['src', 'lib', 'app', 'pages', 'components'];
  audit.hasSource = srcPaths.some(path => existsSync(join(appPath, path)));
  
  // Check for tests
  const testPaths = ['test', 'tests', '__tests__', 'spec', 'src/**/*.test.*', 'src/**/*.spec.*'];
  audit.hasTests = testPaths.some(path => 
    existsSync(join(appPath, path)) || 
    audit.scripts['test'] || 
    audit.scripts['test:unit']
  );
  
  // Check for database
  audit.hasDatabase = existsSync(join(appPath, 'prisma')) || 
                     audit.dependencies.includes('@prisma/client') ||
                     audit.dependencies.includes('mongoose') ||
                     audit.dependencies.includes('typeorm');
  
  // Check for Docker
  audit.hasDockerfile = existsSync(join(appPath, 'Dockerfile')) || 
                       existsSync(join(appPath, 'Dockerfile.optimized'));
  
  // Check for README
  audit.hasReadme = existsSync(join(appPath, 'README.md'));
  
  return audit;
}

function countFiles(dirPath) {
  let count = 0;
  try {
    const items = readdirSync(dirPath);
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        count += countFiles(itemPath);
      } else if (stat.isFile()) {
        count++;
      }
    }
  } catch (error) {
    // Ignore permission errors etc
  }
  return count;
}

function categorizeApplication(appName, audit) {
  // Determine completeness based on multiple factors
  const completenessScore = calculateCompletenessScore(audit);
  
  if (completenessScore >= 80) {
    audit.status = 'complete';
    AUDIT_RESULTS.complete.push(audit);
  } else if (completenessScore >= 40) {
    audit.status = 'in-progress';
    AUDIT_RESULTS.inProgress.push(audit);
  } else if (completenessScore >= 10) {
    audit.status = 'skeleton';
    AUDIT_RESULTS.skeleton.push(audit);
  } else {
    audit.status = 'deprecated';
    AUDIT_RESULTS.deprecated.push(audit);
  }
}

function calculateCompletenessScore(audit) {
  let score = 0;
  
  // File count (max 30 points)
  if (audit.fileCount > 100) score += 30;
  else if (audit.fileCount > 50) score += 20;
  else if (audit.fileCount > 20) score += 10;
  else if (audit.fileCount > 5) score += 5;
  
  // Essential files (max 25 points)
  if (audit.hasPackageJson) score += 5;
  if (audit.hasSource) score += 10;
  if (audit.hasReadme) score += 5;
  if (audit.hasTests) score += 5;
  
  // Framework detection (max 15 points)
  if (audit.framework !== 'unknown') score += 15;
  
  // Dependencies (max 15 points)
  if (audit.dependencies.length > 20) score += 15;
  else if (audit.dependencies.length > 10) score += 10;
  else if (audit.dependencies.length > 5) score += 5;
  
  // Scripts (max 10 points)
  const scripts = Object.keys(audit.scripts);
  if (scripts.includes('dev') || scripts.includes('start')) score += 5;
  if (scripts.includes('build')) score += 3;
  if (scripts.includes('test')) score += 2;
  
  // Advanced features (max 5 points)
  if (audit.hasDatabase) score += 3;
  if (audit.hasDockerfile) score += 2;
  
  return score;
}

function generateAuditReport() {
  logger.info('\n📊 TEKUP ECOSYSTEM AUDIT REPORT\n');
  
  logger.info('🟢 COMPLETE APPLICATIONS:');
  AUDIT_RESULTS.complete.forEach(app => {
    logger.info(`  ✅ ${app.name} (${app.framework}, ${app.fileCount} files)`);
  });
  
  logger.info('\n🟡 IN-PROGRESS APPLICATIONS:');
  AUDIT_RESULTS.inProgress.forEach(app => {
    logger.info(`  🔄 ${app.name} (${app.framework}, ${app.fileCount} files)`);
  });
  
  logger.info('\n🟠 SKELETON/EARLY APPLICATIONS:');
  AUDIT_RESULTS.skeleton.forEach(app => {
    logger.info(`  🏗️  ${app.name} (${app.framework}, ${app.fileCount} files)`);
  });
  
  logger.info('\n🔴 DEPRECATED/EMPTY APPLICATIONS:');
  AUDIT_RESULTS.deprecated.forEach(app => {
    logger.info(`  🗑️  ${app.name} (${app.fileCount} files)`);
  });
  
  // Summary statistics
  const total = AUDIT_RESULTS.complete.length + AUDIT_RESULTS.inProgress.length + 
                AUDIT_RESULTS.skeleton.length + AUDIT_RESULTS.deprecated.length;
  
  logger.info('\n📈 ECOSYSTEM HEALTH:');
  logger.info(`  Total Applications: ${total}`);
  logger.info(`  Complete: ${AUDIT_RESULTS.complete.length} (${Math.round(AUDIT_RESULTS.complete.length/total*100)}%)`);
  logger.info(`  In Progress: ${AUDIT_RESULTS.inProgress.length} (${Math.round(AUDIT_RESULTS.inProgress.length/total*100)}%)`);
  logger.info(`  Skeleton: ${AUDIT_RESULTS.skeleton.length} (${Math.round(AUDIT_RESULTS.skeleton.length/total*100)}%)`);
  logger.info(`  Deprecated: ${AUDIT_RESULTS.deprecated.length} (${Math.round(AUDIT_RESULTS.deprecated.length/total*100)}%)`);
  
  // Recommendations
  logger.info('\n💡 RECOMMENDATIONS:');
  
  if (AUDIT_RESULTS.deprecated.length > 5) {
    logger.info('  🗑️  Consider removing deprecated/empty applications');
  }
  
  if (AUDIT_RESULTS.skeleton.length > AUDIT_RESULTS.complete.length) {
    logger.info('  🏗️  Focus development efforts on completing skeleton applications');
  }
  
  if (AUDIT_RESULTS.complete.length < 5) {
    logger.info('  ⚠️  Limited number of production-ready applications');
  }
  
  logger.info('\n🔍 For detailed analysis, check individual app README files and source code.');
}

auditEcosystem().catch(error => {
  logger.error('Audit failed:', error);
  process.exit(1);
});
