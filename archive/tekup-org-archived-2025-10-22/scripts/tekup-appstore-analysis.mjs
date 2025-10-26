#!/usr/bin/env node
/**
 * TekUp App Store Analysis
 * Analyzes all apps as potential TekUp App Store applications
 * Focus: Business value, unique features, code quality, ecosystem integration
 */

import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../packages/shared/dist/logging/index.js';

const logger = createLogger('tekup-appstore-analysis');

const APPS_DIR = 'apps';

async function analyzeTekUpAppStore() {
  logger.info('🏪 TEKUP APP STORE ANALYSIS - Evaluating 22 Apps as Platform Applications');
  logger.info('================================================================================\n');
  
  const apps = readdirSync(APPS_DIR).filter(name => {
    return statSync(join(APPS_DIR, name)).isDirectory();
  });
  
  const appStoreApps = [];
  
  for (const appName of apps) {
    const appAnalysis = await analyzeAppForStore(appName);
    appStoreApps.push(appAnalysis);
  }
  
  await generateAppStoreCatalog(appStoreApps);
  await generateIntegrationStrategy(appStoreApps);
  await generateEnhancementRoadmap(appStoreApps);
}

async function analyzeAppForStore(appName) {
  const appPath = join(APPS_DIR, appName);
  
  const app = {
    name: appName,
    displayName: formatDisplayName(appName),
    category: categorizeApp(appName),
    businessModel: 'Unknown',
    targetMarket: 'Unknown',
    uniqueFeatures: [],
    technicalStack: [],
    codeQuality: 'Unknown',
    integrationPotential: 'Low',
    marketPotential: 'Unknown',
    developmentEffort: 'Unknown',
    recommendation: 'Unknown'
  };
  
  // Analyze package.json
  const pkgPath = join(appPath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      
      app.technicalStack = analyzeTechnicalStack(pkg);
      app.codeQuality = assessCodeQuality(appPath, pkg);
      app.uniqueFeatures = identifyUniqueFeatures(appName, pkg, appPath);
      app.businessModel = determineBusinessModel(appName, pkg);
      app.targetMarket = identifyTargetMarket(appName);
      app.integrationPotential = assessIntegrationPotential(appName, pkg);
      app.marketPotential = assessMarketPotential(appName);
      app.developmentEffort = assessDevelopmentEffort(appPath, pkg);
      app.recommendation = generateRecommendation(app);
      
    } catch (error) {
      logger.error(`Failed to analyze ${appName}:`, error.message);
    }
  }
  
  return app;
}

function formatDisplayName(appName) {
  const nameMap = {
    'agentrooms-backend': 'AgentRooms Backend',
    'agentrooms-frontend': 'AgentRooms Studio',
    'agents-hub': 'AI Agents Hub',
    'business-metrics-dashboard': 'Business Intelligence Dashboard',
    'business-platform': 'Business Process Platform',
    'danish-enterprise': 'Danish Enterprise Suite',
    'essenza-pro': 'EssenzaPro - Beauty & Fragrance AI',
    'flow-api': 'Flow API - Incident Response Core',
    'flow-web': 'Flow Web - Response Dashboard',
    'foodtruck-os': 'FoodTruck OS - Mobile Business Manager',
    'inbox-ai': 'Inbox AI - Email Intelligence',
    'mcp-studio-enterprise': 'MCP Studio Enterprise',
    'rendetalje-os': 'RendetaljeOS - Cleaning Business Manager',
    'secure-platform': 'Secure Platform - Compliance Suite',
    'tekup-crm-api': 'TekUp CRM API',
    'tekup-crm-web': 'TekUp CRM Dashboard',
    'tekup-lead-platform': 'Lead Qualification Engine',
    'tekup-lead-platform-web': 'Lead Management Dashboard',
    'tekup-mobile': 'TekUp Mobile - Incident Response',
    'voice-agent': 'Voice AI Agent',
    'voicedk-api': 'VoiceDK - Danish Speech Processing',
    'website': 'TekUp Official Website'
  };
  
  return nameMap[appName] || appName.charAt(0).toUpperCase() + appName.slice(1);
}

function categorizeApp(appName) {
  const categories = {
    // Core Platform
    'flow-api': 'Core Platform',
    'flow-web': 'Core Platform', 
    'secure-platform': 'Security & Compliance',
    'website': 'Marketing & Public',
    
    // Business Management
    'tekup-crm-api': 'Business Management',
    'tekup-crm-web': 'Business Management',
    'tekup-lead-platform': 'Business Management',
    'tekup-lead-platform-web': 'Business Management',
    'business-metrics-dashboard': 'Business Intelligence',
    'business-platform': 'Business Management',
    
    // Industry-Specific
    'foodtruck-os': 'Industry Solutions',
    'rendetalje-os': 'Industry Solutions', 
    'essenza-pro': 'Industry Solutions',
    'danish-enterprise': 'Localization',
    
    // AI & Automation
    'agentrooms-backend': 'AI & Automation',
    'agentrooms-frontend': 'AI & Automation',
    'agents-hub': 'AI & Automation',
    'voice-agent': 'AI & Automation',
    'voicedk-api': 'AI & Automation',
    'inbox-ai': 'AI & Automation',
    
    // Mobile & Cross-Platform
    'tekup-mobile': 'Mobile Applications',
    
    // Developer Tools
    'mcp-studio-enterprise': 'Developer Tools'
  };
  
  return categories[appName] || 'Uncategorized';
}

function analyzeTechnicalStack(pkg) {
  const stack = [];
  const deps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})};
  
  if (deps['@nestjs/core']) stack.push('NestJS');
  if (deps['next']) stack.push('Next.js');
  if (deps['react']) stack.push('React');
  if (deps['react-native']) stack.push('React Native');
  if (deps['electron']) stack.push('Electron');
  if (deps['@prisma/client']) stack.push('Prisma');
  if (deps['postgresql'] || deps['pg']) stack.push('PostgreSQL');
  if (deps['redis']) stack.push('Redis');
  if (deps['socket.io']) stack.push('WebSocket');
  if (deps['typescript']) stack.push('TypeScript');
  if (deps['@anthropic-ai/sdk']) stack.push('Anthropic AI');
  if (deps['openai']) stack.push('OpenAI');
  if (deps['googleapis']) stack.push('Google APIs');
  
  return stack;
}

function assessCodeQuality(appPath, pkg) {
  let score = 0;
  
  // Check for TypeScript
  if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) score += 2;
  
  // Check for testing
  if (pkg.devDependencies?.jest || pkg.scripts?.test) score += 2;
  
  // Check for linting
  if (pkg.devDependencies?.eslint || pkg.scripts?.lint) score += 1;
  
  // Check for proper structure
  if (existsSync(join(appPath, 'src'))) score += 1;
  if (existsSync(join(appPath, 'README.md'))) score += 1;
  if (existsSync(join(appPath, 'package.json'))) score += 1;
  
  // Check file count (complexity indicator)
  const fileCount = countFiles(appPath);
  if (fileCount > 50) score += 2;
  if (fileCount > 100) score += 1;
  
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Basic';
}

function countFiles(dirPath) {
  let count = 0;
  try {
    const items = readdirSync(dirPath);
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
        count += countFiles(fullPath);
      } else if (stat.isFile()) {
        count++;
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return count;
}

function identifyUniqueFeatures(appName, pkg, appPath) {
  const features = [];
  
  const featureMap = {
    'agentrooms-backend': ['Multi-agent workspace', 'Claude integration', 'Collaborative AI development'],
    'agentrooms-frontend': ['Agent collaboration UI', 'Real-time coding interface', 'AI pair programming'],
    'agents-hub': ['Agent marketplace', 'AI agent discovery', 'Agent management'],
    'business-metrics-dashboard': ['Business analytics', 'KPI tracking', 'Performance dashboards'],
    'business-platform': ['Process automation', 'Business workflows', 'Enterprise integration'],
    'danish-enterprise': ['CVR lookup', 'Danish compliance', 'PEPPOL integration'],
    'essenza-pro': ['Fragrance recommendation AI', 'Beauty consultation', 'Scent matching algorithm'],
    'flow-api': ['Multi-tenant architecture', 'Incident response', 'Real-time API', 'Compliance automation'],
    'flow-web': ['Real-time dashboard', 'Tenant routing', 'Incident visualization'],
    'foodtruck-os': ['Route optimization', 'Location scoring', 'Mobile business management'],
    'inbox-ai': ['Email intelligence', 'Compliance scanning', 'Document processing'],
    'mcp-studio-enterprise': ['MCP development', 'Plugin management', 'Enterprise tooling'],
    'rendetalje-os': ['Cleaning business logic', 'Danish pricing algorithms', 'Service scheduling'],
    'secure-platform': ['Security compliance', 'GDPR automation', 'Risk assessment'],
    'tekup-crm-api': ['Customer relationship management', 'Lead tracking', 'Sales pipeline'],
    'tekup-crm-web': ['CRM dashboard', 'Contact management', 'Deal visualization'],
    'tekup-lead-platform': ['Lead qualification', 'Scoring algorithms', 'Google Ads integration'],
    'tekup-lead-platform-web': ['Lead management UI', 'Qualification dashboard', 'Filtering system'],
    'tekup-mobile': ['Mobile incident response', 'Field operations', 'Offline capabilities'],
    'voice-agent': ['Voice AI processing', 'Speech recognition', 'Voice commands'],
    'voicedk-api': ['Danish speech processing', 'Nordic language support', 'Voice analytics'],
    'website': ['Marketing site', 'Brand presence', 'Customer acquisition']
  };
  
  return featureMap[appName] || ['Basic functionality'];
}

function determineBusinessModel(appName, pkg) {
  const businessModels = {
    'agentrooms-backend': 'SaaS - Developer Tools ($50-200/month per team)',
    'agentrooms-frontend': 'SaaS - Development Platform ($100-500/month)',
    'agents-hub': 'Marketplace - Agent transactions (10% commission)',
    'business-metrics-dashboard': 'SaaS - Analytics ($200-1000/month)',
    'business-platform': 'Enterprise SaaS ($1000-5000/month)',
    'danish-enterprise': 'SaaS - Compliance ($500-2000/month)',
    'essenza-pro': 'Industry SaaS ($100-400/month per salon)',
    'flow-api': 'Core Platform - Infrastructure',
    'flow-web': 'Core Platform - Interface',
    'foodtruck-os': 'Industry SaaS ($50-200/month per truck)',
    'inbox-ai': 'AI SaaS - Document processing ($100-500/month)',
    'mcp-studio-enterprise': 'Enterprise Tools ($500-2000/month)',
    'rendetalje-os': 'Industry SaaS ($100-300/month per business)',
    'secure-platform': 'Compliance SaaS ($500-3000/month)',
    'tekup-crm-api': 'CRM SaaS ($50-300/month)',
    'tekup-crm-web': 'CRM Interface ($50-300/month)',
    'tekup-lead-platform': 'Lead Gen SaaS ($200-800/month)',
    'tekup-lead-platform-web': 'Lead Management ($200-800/month)',
    'tekup-mobile': 'Mobile SaaS ($30-100/month per user)',
    'voice-agent': 'AI Processing (Pay-per-use)',
    'voicedk-api': 'Language Processing API (Pay-per-call)',
    'website': 'Marketing - Lead generation'
  };
  
  return businessModels[appName] || 'Unknown';
}

function identifyTargetMarket(appName) {
  const markets = {
    'agentrooms-backend': 'Software development teams, AI companies',
    'agentrooms-frontend': 'Individual developers, coding bootcamps',
    'agents-hub': 'AI developers, businesses seeking automation',
    'business-metrics-dashboard': 'SMEs, consultants, analysts',
    'business-platform': 'Large enterprises, process managers',
    'danish-enterprise': 'Danish businesses, compliance officers',
    'essenza-pro': 'Beauty salons, fragrance retailers, consultants',
    'flow-api': 'Enterprise customers, incident response teams',
    'flow-web': 'Operations managers, security teams',
    'foodtruck-os': 'Food truck operators, mobile vendors',
    'inbox-ai': 'Legal firms, compliance teams, enterprises',
    'mcp-studio-enterprise': 'Enterprise developers, DevOps teams',
    'rendetalje-os': 'Cleaning companies, facility management',
    'secure-platform': 'Enterprises, cybersecurity teams',
    'tekup-crm-api': 'Sales teams, small businesses',
    'tekup-crm-web': 'Sales managers, customer service',
    'tekup-lead-platform': 'Marketing teams, lead generation companies',
    'tekup-lead-platform-web': 'Sales teams, marketing managers',
    'tekup-mobile': 'Field workers, emergency responders',
    'voice-agent': 'Call centers, customer service',
    'voicedk-api': 'Danish companies, Nordic market',
    'website': 'Prospective customers, partners'
  };
  
  return markets[appName] || 'General business market';
}

function assessIntegrationPotential(appName, pkg) {
  let potential = 'Low';
  
  // Core platform apps have high integration
  if (['flow-api', 'flow-web', 'secure-platform'].includes(appName)) {
    potential = 'Core';
  }
  // Apps with TekUp dependencies
  else if (pkg.dependencies && Object.keys(pkg.dependencies).some(dep => dep.startsWith('@tekup/'))) {
    potential = 'High';
  }
  // Apps with standard APIs
  else if (pkg.dependencies && (pkg.dependencies['@nestjs/core'] || pkg.dependencies['express'])) {
    potential = 'Medium';
  }
  // Industry-specific but integrable
  else if (['foodtruck-os', 'rendetalje-os', 'essenza-pro'].includes(appName)) {
    potential = 'Medium';
  }
  
  return potential;
}

function assessMarketPotential(appName) {
  const potential = {
    'agentrooms-backend': 'High - Growing AI development market',
    'agentrooms-frontend': 'High - Developer productivity tools',
    'agents-hub': 'Very High - AI marketplace trend',
    'business-metrics-dashboard': 'Medium - Saturated analytics market',
    'business-platform': 'High - Process automation demand',
    'danish-enterprise': 'Medium - Niche but stable market',
    'essenza-pro': 'Medium - Specialized beauty market',
    'flow-api': 'Very High - Core platform value',
    'flow-web': 'Very High - Core platform interface',
    'foodtruck-os': 'Medium - Growing food truck industry',
    'inbox-ai': 'High - Document processing demand',
    'mcp-studio-enterprise': 'High - Developer tooling growth',
    'rendetalje-os': 'Low - Limited market size',
    'secure-platform': 'Very High - Compliance requirements',
    'tekup-crm-api': 'Medium - Competitive CRM market',
    'tekup-crm-web': 'Medium - CRM interface competition',
    'tekup-lead-platform': 'High - Lead generation demand',
    'tekup-lead-platform-web': 'High - Sales productivity tools',
    'tekup-mobile': 'High - Mobile workforce trend',
    'voice-agent': 'High - Voice AI adoption',
    'voicedk-api': 'Medium - Nordic language processing',
    'website': 'High - Marketing foundation'
  };
  
  return potential[appName] || 'Unknown';
}

function assessDevelopmentEffort(appPath, pkg) {
  const fileCount = countFiles(appPath);
  
  if (fileCount < 10) return 'Low - Basic structure needs completion';
  if (fileCount < 50) return 'Medium - Core features implemented';
  if (fileCount < 100) return 'High - Substantial development done';
  return 'Very High - Complex application with extensive features';
}

function generateRecommendation(app) {
  if (app.category === 'Core Platform') {
    return 'CORE - Essential platform component';
  }
  
  if (app.marketPotential.includes('Very High') && app.codeQuality === 'Excellent') {
    return 'PRIORITY - High market potential with quality code';
  }
  
  if (app.marketPotential.includes('High') && app.integrationPotential === 'High') {
    return 'DEVELOP - Strong market and integration potential';
  }
  
  if (app.category.includes('Industry') && app.uniqueFeatures.length > 2) {
    return 'NICHE - Valuable for specific markets';
  }
  
  if (app.codeQuality === 'Basic' || app.marketPotential.includes('Low')) {
    return 'EVALUATE - Requires significant enhancement';
  }
  
  return 'STANDARD - Good candidate for app store';
}

async function generateAppStoreCatalog(apps) {
  logger.info('\n🏪 TEKUP APP STORE CATALOG\n');
  logger.info('==========================================\n');
  
  const categories = {};
  apps.forEach(app => {
    if (!categories[app.category]) {
      categories[app.category] = [];
    }
    categories[app.category].push(app);
  });
  
  Object.entries(categories).forEach(([category, categoryApps]) => {
    logger.info(`📂 ${category.toUpperCase()}`);
    logger.info('─'.repeat(50));
    
    categoryApps.forEach(app => {
      logger.info(`\n🔹 ${app.displayName}`);
      logger.info(`   Business Model: ${app.businessModel}`);
      logger.info(`   Target Market: ${app.targetMarket}`);
      logger.info(`   Tech Stack: ${app.technicalStack.join(', ')}`);
      logger.info(`   Unique Features: ${app.uniqueFeatures.slice(0, 3).join(', ')}`);
      logger.info(`   Code Quality: ${app.codeQuality}`);
      logger.info(`   Market Potential: ${app.marketPotential}`);
      logger.info(`   Integration: ${app.integrationPotential}`);
      logger.info(`   Development: ${app.developmentEffort}`);
      logger.info(`   📊 Recommendation: ${app.recommendation}`);
    });
    
    logger.info('\n');
  });
}

async function generateIntegrationStrategy(apps) {
  logger.info('\n🔗 TEKUP ECOSYSTEM INTEGRATION STRATEGY\n');
  logger.info('=============================================\n');
  
  const coreApps = apps.filter(app => app.category === 'Core Platform');
  const highIntegration = apps.filter(app => app.integrationPotential === 'High');
  const mediumIntegration = apps.filter(app => app.integrationPotential === 'Medium');
  
  logger.info('🏗️ CORE PLATFORM APPS:');
  coreApps.forEach(app => {
    logger.info(`   • ${app.displayName} - ${app.uniqueFeatures.slice(0, 2).join(', ')}`);
  });
  
  logger.info('\n⚡ HIGH INTEGRATION POTENTIAL:');
  highIntegration.forEach(app => {
    logger.info(`   • ${app.displayName} - ${app.businessModel}`);
  });
  
  logger.info('\n🔄 MEDIUM INTEGRATION POTENTIAL:');
  mediumIntegration.forEach(app => {
    logger.info(`   • ${app.displayName} - ${app.targetMarket}`);
  });
}

async function generateEnhancementRoadmap(apps) {
  logger.info('\n🚀 APP ENHANCEMENT ROADMAP\n');
  logger.info('================================\n');
  
  const priorities = {
    'PRIORITY': apps.filter(app => app.recommendation.includes('PRIORITY')),
    'DEVELOP': apps.filter(app => app.recommendation.includes('DEVELOP')),
    'NICHE': apps.filter(app => app.recommendation.includes('NICHE')),
    'STANDARD': apps.filter(app => app.recommendation.includes('STANDARD')),
    'EVALUATE': apps.filter(app => app.recommendation.includes('EVALUATE'))
  };
  
  Object.entries(priorities).forEach(([priority, priorityApps]) => {
    if (priorityApps.length > 0) {
      logger.info(`🎯 ${priority} APPS (${priorityApps.length}):`);
      priorityApps.forEach(app => {
        logger.info(`   • ${app.displayName}`);
        logger.info(`     Market: ${app.marketPotential}`);
        logger.info(`     Effort: ${app.developmentEffort}`);
      });
      logger.info('');
    }
  });
}

analyzeTekUpAppStore().catch(error => {
  logger.error('Analysis failed:', error);
  process.exit(1);
});
