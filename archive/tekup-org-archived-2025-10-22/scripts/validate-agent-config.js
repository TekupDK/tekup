#!/usr/bin/env node
/**
 * Agent Configuration Validator
 * Validates the structure and content of agent configuration files
 */

const fs = require('fs');
const path = require('path');

// Configuration file paths
const AGENT_CONFIG_PATH = path.join(__dirname, '..', 'apps', 'agentrooms-backend', 'config', 'agents.json');

// Required fields for each agent
const REQUIRED_AGENT_FIELDS = [
  'name',
  'description', 
  'role',
  'capabilities',
  'workspaces',
  'file_allowlist',
  'restricted_paths'
];

// Valid capability types
const VALID_CAPABILITIES = [
  'code_analysis',
  'code_generation', 
  'testing',
  'documentation',
  'refactoring',
  'debugging',
  'architecture_design',
  'ui_development',
  'api_development',
  'database_operations',
  'deployment',
  'monitoring',
  'security_review',
  // Frontend specific
  'react-development',
  'nextjs-development',
  'typescript-development',
  'ui-ux-design',
  'responsive-design',
  'component-libraries',
  'state-management',
  'frontend-performance',
  // Backend specific
  'nodejs-development',
  'express-development',
  'database-design',
  'api-design',
  'microservices',
  'backend-performance',
  'data-modeling',
  // Mobile specific
  'react-native-development',
  'cross-platform-mobile',
  'mobile-ui-design',
  'native-integrations',
  'mobile-performance',
  'app-store-deployment',
  // DevOps specific
  'ci-cd-pipelines',
  'docker-containerization',
  'deployment-automation',
  'monitoring-setup',
  'security-hardening',
  'performance-optimization',
  'nx-workspace-management',
  // Documentation specific
  'technical-writing',
  'api-documentation',
  'architecture-diagrams',
  'developer-guides',
  'markdown-expertise',
  'documentation-systems',
  // Orchestration specific
  'task-coordination',
  'workflow-management',
  'team-communication',
  'project-planning',
  'quality-assurance',
  'cross-team-collaboration',
  'workflow-coordination',
  'architecture-decisions',
  'cross-app-integration',
  'task-delegation',
  'conflict-resolution',
  'monorepo-management',
  // Additional frontend capabilities
  'typescript-frontend',
  // Additional backend capabilities
  'nestjs-development',
  'prisma-orm',
  'postgresql-optimization',
  'database-migrations',
  'authentication-security',
  'microservices-architecture'
];

// Valid workspace patterns (relative to monorepo root)
const VALID_WORKSPACE_PATTERNS = [
  // Exact paths
  'apps/flow-web',
  'apps/flow-api', 
  'apps/agentrooms-frontend',
  'apps/agentrooms-backend',
  'apps/site',
  'apps/website',
  'apps/inbox-ai',
  'packages/auth',
  'packages/ui',
  'docs',
  'scripts',
  // Pattern-based paths
  /^apps\/flow-web\/\*\*\/\*$/,
  /^apps\/flow-api\/\*\*\/\*$/,
  /^apps\/agentrooms-frontend\/\*\*\/\*$/,
  /^apps\/agentrooms-backend\/\*\*\/\*$/,
  /^apps\/site\/\*\*\/\*$/,
  /^apps\/website\/\*\*\/\*$/,
  /^apps\/inbox-ai\/\*\*\/\*$/,
  /^apps\/tekup-mobile\/\*\*\/\*$/,
  /^apps\/tekup-crm-web\/\*\*\/\*$/,
  /^apps\/tekup-crm-api\/\*\*\/\*$/,
  /^apps\/tekup-lead-platform\/\*\*\/\*$/,
  /^apps\/tekup-lead-platform-web\/\*\*\/\*$/,
  /^apps\/secure-platform\/\*\*\/\*$/,
  /^apps\/voice-agent\/\*\*\/\*$/,
  /^packages\/\*\*\/\*$/,
  /^packages\/api-client\/\*\*\/\*$/,
  /^packages\/auth\/\*\*\/\*$/,
  /^packages\/config\/\*\*\/\*$/,
  /^packages\/shared\/\*\*\/\*$/,
  /^packages\/ui\/\*\*\/\*$/,
  /^docs\/\*\*\/\*$/,
  /^scripts\/\*\*\/\*$/,
  /^\.github\/\*\*\/\*$/,
  // Global pattern
  /^\*\*\/\*$/,
  // File patterns
  /^\*\*\/README\.md$/,
  /^\*\*\/CHANGELOG\.md$/,
  /^\*\*\/CONTRIBUTING\.md$/,
  /^\*\*\/\*\.md$/,
  /^Dockerfile\*$/,
  /^docker-compose\.\*$/,
  // Root config files
  'nx.json',
  'package.json',
  'pnpm-workspace.yaml',
  '.npmrc',
  'renovate.json',
  'typedoc.json',
  // Global workspace access
  '**/*'
];

function validateAgentConfig() {
  console.log('🤖 Validating agent configuration...');
  
  try {
    // Check if config file exists
    if (!fs.existsSync(AGENT_CONFIG_PATH)) {
      console.error(`❌ Agent configuration file not found: ${AGENT_CONFIG_PATH}`);
      return false;
    }

    // Parse JSON
    const configContent = fs.readFileSync(AGENT_CONFIG_PATH, 'utf8');
    let config;
    
    try {
      config = JSON.parse(configContent);
    } catch (parseError) {
      console.error(`❌ Invalid JSON in agent configuration: ${parseError.message}`);
      return false;
    }

    // Validate structure
    if (!config.agents || typeof config.agents !== 'object') {
      console.error('❌ Missing or invalid "agents" object in configuration');
      return false;
    }

    // Validate each agent
    const agentIds = Object.keys(config.agents);
    if (agentIds.length === 0) {
      console.error('❌ No agents defined in configuration');
      return false;
    }

    let hasOrchestrator = false;
    const errors = [];

    for (const agentId of agentIds) {
      const agent = config.agents[agentId];
      const agentErrors = validateAgent(agentId, agent);
      
      if (agentErrors.length > 0) {
        errors.push(...agentErrors);
      }

      // Check for orchestrator
      if (agent.role === 'orchestrator') {
        hasOrchestrator = true;
      }
    }

    // Ensure there's at least one orchestrator
    if (!hasOrchestrator) {
      errors.push('❌ At least one agent must have role "orchestrator"');
    }

    // Report errors
    if (errors.length > 0) {
      console.error('❌ Agent configuration validation failed:');
      errors.forEach(error => console.error(`  ${error}`));
      return false;
    }

    console.log(`✅ Agent configuration is valid (${agentIds.length} agents configured)`);
    return true;

  } catch (error) {
    console.error(`❌ Error validating agent configuration: ${error.message}`);
    return false;
  }
}

function validateAgent(agentId, agent) {
  const errors = [];

  // Check required fields
  for (const field of REQUIRED_AGENT_FIELDS) {
    if (!agent.hasOwnProperty(field)) {
      errors.push(`Agent "${agentId}" missing required field: ${field}`);
    }
  }

  // Validate capabilities
  if (agent.capabilities) {
    if (!Array.isArray(agent.capabilities)) {
      errors.push(`Agent "${agentId}" capabilities must be an array`);
    } else {
      const invalidCapabilities = agent.capabilities.filter(cap => !VALID_CAPABILITIES.includes(cap));
      if (invalidCapabilities.length > 0) {
        errors.push(`Agent "${agentId}" has invalid capabilities: ${invalidCapabilities.join(', ')}`);
      }
    }
  }

  // Validate workspaces
  if (agent.workspaces) {
    if (!Array.isArray(agent.workspaces)) {
      errors.push(`Agent "${agentId}" workspaces must be an array`);
    } else {
      const invalidWorkspaces = agent.workspaces.filter(ws => {
        // Check exact matches first
        if (VALID_WORKSPACE_PATTERNS.includes(ws)) {
          return false;
        }
        // Check pattern matches
        return !VALID_WORKSPACE_PATTERNS.some(pattern => {
          if (pattern instanceof RegExp) {
            return pattern.test(ws);
          }
          return false;
        });
      });
      if (invalidWorkspaces.length > 0) {
        errors.push(`Agent "${agentId}" has invalid workspaces: ${invalidWorkspaces.join(', ')}`);
      }
    }
  }

  // Validate file_allowlist
  if (agent.file_allowlist && !Array.isArray(agent.file_allowlist)) {
    errors.push(`Agent "${agentId}" file_allowlist must be an array`);
  }

  // Validate restricted_paths
  if (agent.restricted_paths && !Array.isArray(agent.restricted_paths)) {
    errors.push(`Agent "${agentId}" restricted_paths must be an array`);
  }

  return errors;
}

// Run validation if called directly
if (require.main === module) {
  const isValid = validateAgentConfig();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateAgentConfig };