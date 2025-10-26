# MCP Configuration Integration with env-auto.mjs

## Overview

This document outlines the integration between the new centralized MCP configuration system and the existing `scripts/env-auto.mjs` system in the TekUp.org monorepo.

## Integration Strategy

### 1. Environment Variable Extension

The existing `env-auto.mjs` will be extended to automatically generate MCP-specific environment variables:

```javascript
// Addition to scripts/env-auto.mjs

/**
 * Generate MCP-specific environment variables
 * @param {string} appType - Type of application (api, web, service)
 * @param {string} environment - Environment (development, staging, production)
 * @returns {Object} MCP environment variables
 */
function generateMCPEnvironmentVariables(appType, environment) {
  const mcpEnvVars = {
    // Core MCP configuration
    MCP_ENVIRONMENT: environment,
    MCP_BROWSER_PORT: '3030',
    MCP_FILESYSTEM_WORKSPACE_ROOT: path.resolve(process.cwd()),
    
    // API Keys (referencing existing variables)
    MCP_BRAVE_API_KEY: '${BRAVE_API_KEY}',
    MCP_ZAPIER_ENDPOINT: '${ZAPIER_ENDPOINT}',
  };

  // Environment-specific additions
  if (environment === 'development') {
    mcpEnvVars.MCP_BILLY_API_TOKEN = '${BILLY_API_TOKEN}';
    mcpEnvVars.DEBUG = 'mcp:*';
  }

  // App-specific customizations
  if (appType === 'api') {
    mcpEnvVars.MCP_FILESYSTEM_WORKSPACE_ROOT = path.resolve(process.cwd(), '../..');
  }

  return mcpEnvVars;
}

// Integration with existing generateEnvFile function
function generateEnvFile(appPath, appType) {
  // ... existing logic ...
  
  // Add MCP environment variables
  const mcpVars = generateMCPEnvironmentVariables(appType, environment);
  envContent += '\n# MCP Configuration\n';
  
  Object.entries(mcpVars).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });
  
  // ... rest of existing logic ...
}
```

### 2. MCP Configuration Loader Integration

```javascript
// Addition to scripts/env-auto.mjs

/**
 * Validate MCP configuration and generate editor configs
 */
async function processMCPConfiguration() {
  try {
    const { validateConfiguration } = await import('../.mcp/scripts/validator.js');
    const { buildEditorConfigs } = await import('../.mcp/scripts/builder.js');
    
    console.log('🔧 Validating MCP configuration...');
    const isValid = await validateConfiguration();
    
    if (!isValid) {
      console.warn('⚠️  MCP configuration validation failed - skipping editor config generation');
      return;
    }
    
    console.log('📝 Generating editor-specific MCP configurations...');
    await buildEditorConfigs();
    
    console.log('✅ MCP configuration processing complete');
  } catch (error) {
    console.warn('⚠️  MCP configuration processing failed:', error.message);
  }
}

// Add to main execution flow
async function main() {
  // ... existing env-auto logic ...
  
  // Process MCP configurations
  await processMCPConfiguration();
  
  console.log('🎉 Environment setup complete!');
}
```

### 3. Package.json Scripts Integration

Update the monorepo's `package.json` to include MCP scripts:

```json
{
  "scripts": {
    "postinstall": "node scripts/env-auto.mjs && pnpm -w run playwright:install && pnpm mcp:validate",
    "env:auto": "node scripts/env-auto.mjs && pnpm mcp:build",
    
    "mcp:validate": "node .mcp/scripts/validator.js",
    "mcp:build": "node .mcp/scripts/builder.js", 
    "mcp:migrate": "node .mcp/scripts/migrator.js",
    "mcp:clean": "node .mcp/scripts/cleaner.js",
    "mcp:dev": "node .mcp/scripts/dev-watcher.js"
  }
}
```

## Environment Variable Mapping

### Existing Variables (from inventory)
```bash
BRAVE_API_KEY=BSA5503dX9kHsCxVoYAVub3VvWB1yxE
BILLY_API_TOKEN=43e7439bccb58a8a96dd57dd06dae10add009111  
ZAPIER_ENDPOINT=https://mcp.zapier.com/api/mcp/s/ZDNi...
```

### New MCP Variables
```bash
MCP_ENVIRONMENT=development
MCP_BROWSER_PORT=3030
MCP_FILESYSTEM_WORKSPACE_ROOT=C:\Users\empir\Tekup-org
MCP_BRAVE_API_KEY=${BRAVE_API_KEY}
MCP_BILLY_API_TOKEN=${BILLY_API_TOKEN}
MCP_ZAPIER_ENDPOINT=${ZAPIER_ENDPOINT}
```

## Development Workflow Updates

### Updated Development Commands
```bash
# Bootstrap entire monorepo (now includes MCP)
pnpm bootstrap

# Auto-generate .env files + MCP configs
pnpm run env:auto

# Run all services (MCP configs auto-loaded)
pnpm dev

# MCP-specific commands
pnpm mcp:validate      # Validate configurations
pnpm mcp:build         # Generate editor configs  
pnpm mcp:dev           # Development mode with hot-reload
```

### IDE Integration

The generated `.env` files will now include MCP variables, making them available to:
- **NestJS APIs** via `@nestjs/config`
- **Next.js apps** via `process.env`
- **Shared packages** via environment access
- **Editor MCP servers** via adapter transformation

## Backward Compatibility

### Transition Period
- **Existing configurations remain functional** during migration
- **New system runs in parallel** until fully validated
- **Gradual migration** of editors one at a time
- **Rollback capability** if issues arise

### Legacy Support
- **Old MCP files preserved** with `.legacy` extension
- **Migration scripts** to convert old to new format
- **Validation warnings** for deprecated configurations
- **Documentation** for manual migration if needed

## Testing Strategy

### Validation Tests
```bash
# Test MCP configuration validation
pnpm mcp:validate

# Test environment variable generation  
pnpm run env:auto --dry-run

# Test editor configuration generation
pnpm mcp:build --verbose
```

### Integration Tests
```bash
# Test full workflow
pnpm bootstrap && pnpm dev

# Test specific editors
pnpm mcp:build --editor=windsurf
pnpm mcp:build --editor=kiro
```

## Migration Timeline

### Phase 1: Foundation ✅
- [x] MCP directory structure created
- [x] Base configurations defined
- [x] Integration plan documented

### Phase 2: Implementation (Next)
- [ ] Extend `env-auto.mjs` with MCP support
- [ ] Implement configuration loader and validator
- [ ] Create basic editor adapters

### Phase 3: Integration
- [ ] Test integration with existing workflow
- [ ] Update documentation and guides
- [ ] Roll out to development environment

### Phase 4: Production
- [ ] Deploy to staging for validation
- [ ] Production rollout
- [ ] Legacy cleanup

## Benefits of Integration

### For Developers
- **Seamless experience** - MCP configs generated automatically
- **Consistent environment** - Same variables across all apps
- **No manual configuration** - Everything handled by existing workflow

### For Operations  
- **Centralized management** - Single place to update MCP settings
- **Environment parity** - Consistent configs across dev/staging/prod
- **Automated validation** - Catch configuration errors early

### For Maintenance
- **Single source of truth** - No more scattered configs
- **Version controlled** - All changes tracked in Git
- **Documented changes** - Clear audit trail for modifications

---

**Status:** Ready for implementation  
**Next Step:** Begin Todo #3 - Create TypeScript Interfaces and Validation Schemas
