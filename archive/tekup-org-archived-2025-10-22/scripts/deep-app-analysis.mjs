#!/usr/bin/env node
/**
 * Deep Analysis of All TekUp Applications
 * Analyzes functionality, dependencies, and integration potential
 */

import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../packages/shared/dist/logging/index.js';

const logger = createLogger('deep-app-analysis');

const APPS_DIR = 'apps';

async function analyzeAllApps() {
  logger.info('🔍 Starting Deep Analysis of TekUp Applications...');
  
  const apps = readdirSync(APPS_DIR).filter(name => {
    return statSync(join(APPS_DIR, name)).isDirectory();
  });
  
  const analysis = {};
  
  for (const appName of apps) {
    analysis[appName] = await analyzeApp(appName);
  }
  
  await generateIntegrationPlan(analysis);
  await identifyMergeOpportunities(analysis);
}

async function analyzeApp(appName) {
  const appPath = join(APPS_DIR, appName);
  
  const app = {
    name: appName,
    path: appPath,
    framework: 'unknown',
    dependencies: [],
    devDependencies: [],
    scripts: {},
    hasDatabase: false,
    databaseType: null,
    hasAPI: false,
    hasUI: false,
    ports: [],
    features: [],
    integrationPoints: [],
    businessDomain: 'unknown'
  };
  
  // Analyze package.json
  const pkgPath = join(appPath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      app.dependencies = Object.keys(pkg.dependencies || {});
      app.devDependencies = Object.keys(pkg.devDependencies || {});
      app.scripts = pkg.scripts || {};
      
      // Framework detection
      app.framework = detectFramework(app.dependencies);
      
      // Database detection
      app.hasDatabase = detectDatabase(app.dependencies);
      app.databaseType = getDatabaseType(app.dependencies);
      
      // API detection
      app.hasAPI = detectAPI(app.dependencies);
      
      // UI detection
      app.hasUI = detectUI(app.dependencies);
      
    } catch (error) {
      logger.error(`Failed to parse package.json for ${appName}:`, error.message);
    }
  }
  
  // Analyze source structure
  await analyzeSourceStructure(app);
  
  // Business domain classification
  app.businessDomain = classifyBusinessDomain(app);
  
  // Integration points
  app.integrationPoints = findIntegrationPoints(app);
  
  return app;
}

function detectFramework(dependencies) {
  if (dependencies.includes('@nestjs/core')) return 'NestJS';
  if (dependencies.includes('next')) return 'Next.js';
  if (dependencies.includes('react-native')) return 'React Native';
  if (dependencies.includes('electron')) return 'Electron';
  if (dependencies.includes('react')) return 'React';
  if (dependencies.includes('vue')) return 'Vue.js';
  if (dependencies.includes('express')) return 'Express';
  if (dependencies.includes('fastify')) return 'Fastify';
  return 'unknown';
}

function detectDatabase(dependencies) {
  return dependencies.some(dep => 
    dep.includes('prisma') || 
    dep.includes('mongoose') || 
    dep.includes('typeorm') ||
    dep.includes('mysql') ||
    dep.includes('postgres') ||
    dep.includes('sqlite')
  );
}

function getDatabaseType(dependencies) {
  if (dependencies.includes('@prisma/client')) return 'Prisma + PostgreSQL';
  if (dependencies.includes('mongoose')) return 'MongoDB';
  if (dependencies.includes('typeorm')) return 'TypeORM';
  if (dependencies.includes('mysql2')) return 'MySQL';
  if (dependencies.includes('pg')) return 'PostgreSQL';
  if (dependencies.includes('sqlite3')) return 'SQLite';
  return null;
}

function detectAPI(dependencies) {
  return dependencies.some(dep =>
    dep.includes('@nestjs/core') ||
    dep.includes('express') ||
    dep.includes('fastify') ||
    dep.includes('koa')
  );
}

function detectUI(dependencies) {
  return dependencies.some(dep =>
    dep.includes('react') ||
    dep.includes('vue') ||
    dep.includes('svelte') ||
    dep.includes('next')
  );
}

async function analyzeSourceStructure(app) {
  const srcPath = join(app.path, 'src');
  if (!existsSync(srcPath)) return;
  
  try {
    const srcFiles = getAllFiles(srcPath);
    
    // Look for specific patterns
    app.features = [];
    
    srcFiles.forEach(file => {
      const content = file.toLowerCase();
      
      // API patterns
      if (content.includes('controller') || content.includes('route')) {
        app.features.push('REST API');
      }
      if (content.includes('websocket') || content.includes('socket.io')) {
        app.features.push('WebSocket');
      }
      if (content.includes('graphql')) {
        app.features.push('GraphQL');
      }
      
      // Business logic patterns
      if (content.includes('lead') && content.includes('service')) {
        app.features.push('Lead Management');
      }
      if (content.includes('user') || content.includes('auth')) {
        app.features.push('Authentication');
      }
      if (content.includes('tenant') || content.includes('multi-tenant')) {
        app.features.push('Multi-tenancy');
      }
      if (content.includes('metric') || content.includes('prometheus')) {
        app.features.push('Metrics');
      }
      if (content.includes('compliance') || content.includes('gdpr')) {
        app.features.push('Compliance');
      }
      if (content.includes('email') || content.includes('notification')) {
        app.features.push('Notifications');
      }
      if (content.includes('crm') || content.includes('customer')) {
        app.features.push('CRM');
      }
      if (content.includes('voice') || content.includes('audio')) {
        app.features.push('Voice Processing');
      }
      if (content.includes('agent') || content.includes('ai')) {
        app.features.push('AI/Agent');
      }
    });
    
    // Remove duplicates
    app.features = [...new Set(app.features)];
    
  } catch (error) {
    logger.error(`Error analyzing source for ${app.name}:`, error.message);
  }
}

function getAllFiles(dir) {
  let files = [];
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(getAllFiles(fullPath));
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
  return files;
}

function classifyBusinessDomain(app) {
  const name = app.name.toLowerCase();
  const features = app.features.map(f => f.toLowerCase());
  
  // Core TekUp domains
  if (name.includes('flow') || features.includes('lead management')) {
    return 'Core Incident Response';
  }
  if (name.includes('crm') || features.includes('crm')) {
    return 'Customer Relationship Management';
  }
  if (name.includes('secure') || features.includes('compliance')) {
    return 'Security & Compliance';
  }
  if (name.includes('inbox') || name.includes('email')) {
    return 'Email Processing';
  }
  if (name.includes('mobile')) {
    return 'Mobile Experience';
  }
  if (name.includes('voice') || features.includes('voice processing')) {
    return 'Voice & Audio';
  }
  if (name.includes('agent') || features.includes('ai/agent')) {
    return 'AI & Automation';
  }
  if (name.includes('business') || name.includes('metric')) {
    return 'Business Intelligence';
  }
  if (name.includes('website') || name.includes('landing')) {
    return 'Marketing & Public';
  }
  
  return 'Unknown Domain';
}

function findIntegrationPoints(app) {
  const points = [];
  
  // Database integration
  if (app.hasDatabase) {
    points.push(`Database: ${app.databaseType}`);
  }
  
  // API integration  
  if (app.hasAPI) {
    points.push('REST API Endpoints');
  }
  
  // TekUp package usage
  const tekupPackages = app.dependencies.filter(dep => dep.startsWith('@tekup/'));
  if (tekupPackages.length > 0) {
    points.push(`TekUp Packages: ${tekupPackages.join(', ')}`);
  }
  
  // Feature-based integration
  if (app.features.includes('Multi-tenancy')) {
    points.push('Multi-tenant Architecture');
  }
  if (app.features.includes('WebSocket')) {
    points.push('Real-time Communication');
  }
  if (app.features.includes('Metrics')) {
    points.push('Monitoring Integration');
  }
  
  return points;
}

async function generateIntegrationPlan(analysis) {
  logger.info('\n🏗️  TEKUP ECOSYSTEM INTEGRATION PLAN\n');
  
  // Group by business domain
  const domains = {};
  Object.values(analysis).forEach(app => {
    if (!domains[app.businessDomain]) {
      domains[app.businessDomain] = [];
    }
    domains[app.businessDomain].push(app);
  });
  
  // Print domains
  for (const [domain, apps] of Object.entries(domains)) {
    logger.info(`📋 ${domain.toUpperCase()}:`);
    apps.forEach(app => {
      const features = app.features.length > 0 ? ` (${app.features.slice(0,3).join(', ')})` : '';
      logger.info(`  • ${app.name} - ${app.framework}${features}`);
    });
    logger.info('');
  }
}

async function identifyMergeOpportunities(analysis) {
  logger.info('🔄 MERGE OPPORTUNITIES:\n');
  
  const apps = Object.values(analysis);
  
  // Find apps with similar functionality
  const mergeGroups = {};
  
  apps.forEach(app => {
    const key = `${app.businessDomain}-${app.framework}`;
    if (!mergeGroups[key]) {
      mergeGroups[key] = [];
    }
    mergeGroups[key].push(app);
  });
  
  // Identify merge candidates
  Object.entries(mergeGroups).forEach(([key, group]) => {
    if (group.length > 1) {
      logger.info(`🔗 ${key}:`);
      group.forEach(app => {
        logger.info(`  → ${app.name}: [${app.features.join(', ')}]`);
      });
      logger.info('  💡 Merge Strategy: Combine similar features into single service\n');
    }
  });
  
  // Feature overlap analysis
  logger.info('⚡ FEATURE OVERLAP:\n');
  const featureMap = {};
  
  apps.forEach(app => {
    app.features.forEach(feature => {
      if (!featureMap[feature]) {
        featureMap[feature] = [];
      }
      featureMap[feature].push(app.name);
    });
  });
  
  Object.entries(featureMap).forEach(([feature, appNames]) => {
    if (appNames.length > 1) {
      logger.info(`🔄 ${feature}: ${appNames.join(', ')}`);
    }
  });
}

analyzeAllApps().catch(error => {
  logger.error('Analysis failed:', error);
  process.exit(1);
});
