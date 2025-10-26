# TekUp MCP Configuration Architecture

**Version:** 1.0.0  
**Created:** 2025-01-10T21:31:34Z  
**Status:** Design Phase  

## 📋 Executive Summary

This document outlines the centralized MCP (Model Context Protocol) configuration architecture for the TekUp.org monorepo. The design consolidates 58+ scattered MCP configurations across 5 editors into a single, maintainable, and secure system.

### Key Objectives
- **Consolidation:** Single source of truth for all MCP configurations
- **Security:** Environment variable-based API key management
- **Performance:** Optimized server configurations per environment
- **Integration:** Seamless integration with existing `env-auto.mjs` system
- **Maintainability:** Type-safe configuration with JSON Schema validation

## 🏗️ Architecture Overview

### Directory Structure
```
Tekup-org/
├── .mcp/                           # Central MCP directory
│   ├── configs/                    # Configuration files
│   │   ├── base.json              # Base configuration
│   │   ├── development.json       # Development overrides
│   │   ├── staging.json           # Staging overrides
│   │   └── production.json        # Production overrides
│   ├── schemas/                    # Validation schemas
│   │   ├── mcp-config.schema.json # JSON Schema
│   │   └── types.ts               # TypeScript definitions
│   ├── scripts/                    # Management scripts
│   │   ├── loader.ts              # Configuration loader
│   │   ├── merger.ts              # Configuration merger
│   │   ├── validator.ts           # Schema validator
│   │   └── migrator.ts            # Migration tools
│   ├── adapters/                   # Editor-specific adapters
│   │   ├── windsurf.ts            # Windsurf adapter
│   │   ├── kiro.ts                # Kiro adapter
│   │   ├── vscode.ts              # VS Code adapter
│   │   ├── trae.ts                # Trae adapter
│   │   └── cursor.ts              # Cursor adapter
│   ├── docs/                       # Documentation
│   │   ├── architecture.md        # This document
│   │   ├── configuration-guide.md # Configuration reference
│   │   └── migration-guide.md     # Migration instructions
│   └── logs/                       # Log files (runtime)
│       ├── mcp-dev.log
│       ├── mcp-staging.log
│       └── mcp-production.log
```

## 🔧 Core Components

### 1. Configuration Hierarchy

#### Base Configuration (`base.json`)
- **Purpose:** Foundation configuration shared across all environments
- **Servers:** Browser, Filesystem, Search, Automation
- **Features:** Security defaults, performance baselines, capability definitions

#### Environment Overrides
- **Development:** Debug logging, extended timeouts, additional servers (billing)
- **Staging:** Production-like with testing features, moderate logging
- **Production:** Security hardened, minimal logging, performance optimized

#### Configuration Inheritance
```
base.json
├── development.json (extends base.json)
├── staging.json (extends base.json)  
└── production.json (extends base.json)
```

### 2. Unified MCP Servers

#### Browser Server (Consolidated)
**Replaces 4 existing implementations:**
- `browser-mcp-config.json` → Standard browser automation
- `warp-agent-infra-mcp.json` → Agent infrastructure features  
- `warp-browser-tools-mcp.json` → Browser tools integration
- `warp-mcp-config.json` → Custom server capabilities

**Features:**
- Single optimized browser automation server
- Environment-specific configurations
- Performance and reliability optimizations
- Comprehensive tool coverage

#### Filesystem Server
**Standardizes access patterns:**
- Development: `C:\Users\empir\Tekup-org` + `C:\Users\empir\Lead-håndtering`
- Staging/Production: Configurable workspace root
- Security-scoped access per environment

#### Search Server
**Consolidates search capabilities:**
- Unified Brave Search API integration
- Environment variable-based API key management
- Rate limiting and error handling

#### Automation Server  
**Zapier workflow integration:**
- HTTP transport with proper headers
- Environment-specific endpoint configuration
- Retry logic and circuit breakers

#### Billing Server (Dev/Staging only)
**Billy integration for development:**
- Only enabled in non-production environments
- API token management via environment variables
- Invoice and customer management tools

### 3. Environment Variable Integration

#### Required Environment Variables
```bash
# MCP Configuration
MCP_ENVIRONMENT=development
MCP_BROWSER_PORT=3030
MCP_FILESYSTEM_WORKSPACE_ROOT=C:\Users\empir\Tekup-org

# API Keys
MCP_BRAVE_API_KEY=${BRAVE_API_KEY}
MCP_BILLY_API_TOKEN=${BILLY_API_TOKEN}
MCP_ZAPIER_ENDPOINT=${ZAPIER_ENDPOINT}

# Node Environment
NODE_ENV=development
```

#### Integration with `env-auto.mjs`
```javascript
// Extension to existing env-auto.mjs
const generateMCPEnvironmentVariables = (appType, environment) => {
  const mcpEnvVars = {
    MCP_ENVIRONMENT: environment,
    MCP_BROWSER_PORT: '3030',
    MCP_FILESYSTEM_WORKSPACE_ROOT: path.resolve(process.cwd()),
  };

  if (environment === 'development') {
    mcpEnvVars.MCP_BRAVE_API_KEY = '${BRAVE_API_KEY}';
    mcpEnvVars.MCP_BILLY_API_TOKEN = '${BILLY_API_TOKEN}';
  }

  return mcpEnvVars;
};
```

### 4. Editor Integration Strategy

#### Adapter Pattern
Each editor has a specific adapter that:
- Loads centralized configuration
- Transforms to editor-specific format
- Handles editor-specific overrides
- Provides live configuration updates

#### Editor-Specific Transformations

**Windsurf Format:**
```typescript
interface WindsurfMCPConfig {
  mcpServers: Record<string, WindsurfServerConfig>;
}
```

**VS Code Format:**  
```typescript
interface VSCodeMCPConfig {
  servers: Record<string, VSCodeServerConfig>;
  inputs?: InputConfig[];
}
```

**Kiro/Trae Format:**
```typescript
interface KiroMCPConfig {
  mcpServers: Record<string, KiroServerConfig>;
}
```

## 🔐 Security Architecture

### API Key Management
- **No plaintext storage** in configuration files
- **Environment variable references** with `${VAR}` syntax
- **Key rotation support** through environment updates
- **Validation** ensures all referenced keys exist

### Access Control
- **Filesystem scope** limited per environment
- **Sandbox mode** enabled in staging/production
- **HTTPS requirement** for production environments
- **Rate limiting** prevents abuse

### Audit Logging
- **Security events** logged in production
- **Configuration changes** tracked
- **API access** monitored and logged

## ⚡ Performance Optimizations

### Connection Management
- **Connection pooling** for HTTP transports
- **Request queuing** with limits
- **Circuit breakers** for failing services
- **Health checks** with configurable intervals

### Resource Limits
- **Memory limits** per environment
- **CPU limits** in production
- **Concurrent request limits** per server
- **Timeout configurations** optimized per use case

### Caching Strategy
- **Configuration caching** with TTL
- **Hot reload** in development
- **Lazy loading** of adapters
- **Memoization** of validation results

## 📊 Monitoring and Observability

### Metrics Collection
- **Server health** monitoring
- **Response times** tracking
- **Error rates** monitoring  
- **Resource usage** tracking

### Alerting System
- **Threshold-based alerts** for errors and performance
- **Multiple notification channels** (email, Slack)
- **Environment-specific thresholds**
- **Escalation policies**

### Logging Strategy
- **Structured logging** with JSON format
- **Environment-specific log levels**
- **Log rotation** and retention policies
- **Centralized log aggregation** ready

## 🔄 Configuration Loader System

### Loading Process
1. **Environment Detection** (`MCP_ENVIRONMENT` or `NODE_ENV`)
2. **Base Configuration Loading** from `base.json`
3. **Environment Override Application** from `{environment}.json`
4. **Deep Merge** of configurations
5. **Environment Variable Substitution**
6. **Schema Validation** against JSON Schema
7. **Configuration Caching** for performance

### Merge Strategy
```typescript
const mergeConfigurations = (base: MCPConfig, override: MCPConfig): MCPConfig => {
  return deepMerge(base, override, {
    arrayMerge: (target, source) => source, // Override arrays completely
    customMerge: (key) => {
      if (key === 'mcpServers') {
        return (target, source) => deepMerge(target, source);
      }
    }
  });
};
```

### Error Handling
- **Graceful degradation** for missing configurations
- **Validation error reporting** with detailed messages
- **Fallback mechanisms** for critical failures
- **Health checks** ensure system availability

## 🚀 Integration Points

### Build System Integration
```json
// package.json scripts
{
  "mcp:validate": "node .mcp/scripts/validator.js",
  "mcp:build": "node .mcp/scripts/builder.js", 
  "mcp:migrate": "node .mcp/scripts/migrator.js",
  "mcp:clean": "node .mcp/scripts/cleaner.js"
}
```

### CI/CD Integration
```yaml
# GitHub Actions integration
- name: Validate MCP Configuration
  run: pnpm mcp:validate

- name: Build MCP Configurations  
  run: pnpm mcp:build
```

### Development Workflow
```bash
# Development commands
pnpm mcp:validate      # Validate all configurations
pnpm mcp:build         # Generate editor-specific configs
pnpm mcp:migrate       # Migrate from old configurations
pnpm mcp:clean         # Clean up old configurations
```

## 📋 Migration Strategy

### Phase 1: Foundation (Current)
- ✅ Architecture design
- ✅ Directory structure creation
- ✅ Base configurations
- ✅ JSON Schema validation

### Phase 2: Core Implementation (Next)
- Configuration loader and merger
- Environment variable substitution
- TypeScript interface extensions
- Basic adapter implementations

### Phase 3: Editor Integration
- Complete adapter implementations
- Configuration migration scripts
- Testing and validation
- Documentation updates

### Phase 4: Production Deployment
- Rollout to development environment
- Staging environment testing
- Production deployment
- Legacy configuration cleanup

## 🎯 Success Metrics

### Technical Metrics
- **Configuration consolidation:** 58+ files → 4 core files
- **API key security:** 0 plaintext keys in configurations
- **Server consolidation:** 4 browser servers → 1 unified server
- **Build time impact:** <5% increase in build time
- **Memory usage:** <10MB additional memory usage

### Operational Metrics
- **Configuration errors:** <1% error rate
- **Deployment success:** >99% success rate
- **Response time:** <100ms configuration loading
- **Developer experience:** <5min onboarding for new developers

## 🔮 Future Enhancements

### Advanced Features
- **Dynamic configuration updates** without restarts
- **A/B testing** for configuration changes
- **Multi-tenant** configuration support
- **Configuration version control** and rollback

### Integration Expansions
- **Additional editor support** (Neovim, Emacs, etc.)
- **Cloud-based configuration** synchronization
- **Team-based configuration** sharing
- **Configuration analytics** and usage tracking

---

**Next Phase:** Implementation of configuration loader and merger system (Todo #3)
