# Tekup MCP Configuration Management System

## Overview

The Tekup MCP (Model Context Protocol) Configuration Management System is a centralized, environment-aware configuration solution designed to streamline MCP server management across multiple editors and environments within the Tekup monorepo.

## Architecture

### System Design

The MCP configuration system follows a layered architecture:

```
┌─────────────────────────────────────┐
│           Editor Layer              │
│  (Windsurf, VS Code, Kiro, etc.)   │
├─────────────────────────────────────┤
│         Adapter Layer               │
│   (Editor-specific adapters)       │
├─────────────────────────────────────┤
│      Configuration Layer            │
│   (Loader, Merger, Validator)      │
├─────────────────────────────────────┤
│         Storage Layer               │
│  (Config files, Schemas, Env vars) │
└─────────────────────────────────────┘
```

### Directory Structure

```
.mcp/
├── configs/                    # Configuration files
│   ├── base.json              # Base configuration
│   ├── development.json       # Development overrides
│   ├── staging.json           # Staging overrides
│   └── production.json        # Production overrides
├── schemas/                   # TypeScript interfaces and validation
│   ├── index.ts              # Main type definitions
│   ├── validation.ts         # JSON Schema validation
│   └── types.ts              # Additional type definitions
├── lib/                      # Core library modules
│   ├── loader.ts             # Configuration loader
│   ├── merger.ts             # Configuration merger
│   ├── validator.ts          # Configuration validator
│   └── adapters/             # Editor-specific adapters
│       ├── windsurf.ts
│       ├── vscode.ts
│       ├── kiro.ts
│       ├── trae.ts
│       └── cursor.ts
├── scripts/                  # Management scripts
│   ├── migration-tool.ts     # Migration utilities
│   ├── cleanup-tool.ts       # Cleanup utilities
│   └── build-integration.ts  # Build system integration
└── docs/                     # Documentation
    ├── README.md             # This file
    ├── ARCHITECTURE.md       # Detailed architecture
    ├── SETUP.md             # Setup guide
    ├── MIGRATION.md         # Migration guide
    ├── TROUBLESHOOTING.md   # Troubleshooting guide
    └── API.md               # API reference
```

## Key Features

### 🎯 Centralized Management
- Single source of truth for all MCP configurations
- Environment-specific overrides (development, staging, production)
- Consistent configuration across all editors

### 🔒 Secure API Key Management
- Environment variable references instead of hardcoded keys
- Integration with existing env-auto.mjs system
- Support for key rotation and validation

### 🚀 Multi-Editor Support
- Dedicated adapters for Windsurf, VS Code, Kiro, Trae, and Cursor
- Editor-specific configuration transformations
- Live configuration updates

### 🔧 Developer Experience
- TypeScript interfaces for type safety
- JSON Schema validation
- Hot-reload support in development
- Comprehensive error reporting

### 📦 Build Integration
- pnpm script integration
- CI/CD pipeline validation
- Pre-commit hooks
- Automated cleanup and migration tools

## Quick Start

### 1. Environment Setup

Ensure your environment variables are configured:

```bash
# Copy environment template
cp .env.example .env

# Configure your API keys
nano .env
```

### 2. Validate Configuration

```bash
# Validate all configurations
pnpm mcp:validate

# Validate specific environment
pnpm mcp:validate --env development
```

### 3. Build Editor Configurations

```bash
# Generate all editor configurations
pnpm mcp:build

# Generate for specific editor
pnpm mcp:build --editor windsurf
```

### 4. Test Configuration

```bash
# Test MCP server connections
pnpm mcp:test

# Test specific server
pnpm mcp:test --server browser
```

## Configuration Structure

### Base Configuration (`configs/base.json`)

```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "Tekup MCP Configuration",
    "description": "Centralized MCP configuration for Tekup monorepo"
  },
  "servers": {
    "browser": {
      "command": "npx",
      "args": ["@tekup/browser-mcp"],
      "env": {
        "BROWSER_PATH": "${BROWSER_PATH}",
        "HEADLESS": "${BROWSER_HEADLESS:-true}"
      }
    }
  },
  "globalSettings": {
    "timeout": 30000,
    "retryCount": 3,
    "logLevel": "info"
  }
}
```

### Environment Overrides

Environment-specific files can override or extend the base configuration:

```json
// configs/development.json
{
  "servers": {
    "browser": {
      "env": {
        "HEADLESS": "false",
        "DEBUG": "true"
      }
    }
  },
  "globalSettings": {
    "logLevel": "debug"
  }
}
```

## Editor Integration

### Windsurf Integration

```typescript
// .windsurf/mcp_servers.json is automatically generated
import { loadMCPConfig } from '@tekup/mcp-config';

const config = await loadMCPConfig({
  editor: 'windsurf',
  environment: process.env.NODE_ENV
});
```

### VS Code Integration

```json
// .vscode/settings.json
{
  "mcp.configPath": ".mcp/configs"
}
```

## API Reference

### Configuration Loader

```typescript
import { loadMCPConfig, MCPConfig } from '@tekup/mcp-config';

// Load configuration for current environment
const config: MCPConfig = await loadMCPConfig();

// Load for specific environment
const devConfig = await loadMCPConfig({ environment: 'development' });

// Load for specific editor
const windsurfConfig = await loadMCPConfig({ 
  editor: 'windsurf',
  environment: 'production'
});
```

### Configuration Validation

```typescript
import { validateConfig } from '@tekup/mcp-config';

const isValid = await validateConfig(config);
if (!isValid) {
  console.error('Configuration validation failed');
}
```

### Hot Reload (Development)

```typescript
import { watchConfig } from '@tekup/mcp-config';

// Watch for configuration changes
watchConfig((newConfig) => {
  console.log('Configuration updated:', newConfig);
  // Restart MCP servers, update editor settings, etc.
});
```

## Environment Variables

### Required Variables

```bash
# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Browser Configuration
BROWSER_PATH=/path/to/browser
BROWSER_HEADLESS=true

# Environment
NODE_ENV=development
MCP_CONFIG_ENV=development
```

### Optional Variables

```bash
# Logging
MCP_LOG_LEVEL=info
MCP_LOG_FILE=/path/to/logfile

# Performance
MCP_CACHE_TTL=3600
MCP_TIMEOUT=30000

# Debug
MCP_DEBUG=false
MCP_VERBOSE=false
```

## Migration Guide

### From Legacy Configurations

Use the migration tool to upgrade from legacy configurations:

```bash
# Discover legacy configurations
pnpm mcp:migrate discover

# Preview migration (dry run)
pnpm mcp:migrate --dry-run

# Perform migration
pnpm mcp:migrate

# Cleanup old configurations
pnpm mcp:clean --obsolete
```

### Manual Migration Steps

1. **Backup existing configurations**
2. **Run discovery tool** to identify all MCP configs
3. **Execute migration** with validation
4. **Test new configuration** with each editor
5. **Clean up legacy files** after confirmation

## Troubleshooting

### Common Issues

#### Configuration Not Loading
```bash
# Check configuration validity
pnpm mcp:validate

# Check environment variables
pnpm mcp:test --env-check

# Verify file permissions
ls -la .mcp/configs/
```

#### Editor Integration Issues
```bash
# Regenerate editor configurations
pnpm mcp:build --force

# Check editor-specific logs
tail -f ~/.windsurf/logs/mcp.log
```

#### API Key Problems
```bash
# Validate API keys
pnpm mcp:test --keys-only

# Check environment loading
node -e "console.log(process.env.OPENAI_API_KEY ? 'OK' : 'Missing')"
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
export MCP_DEBUG=true
export MCP_LOG_LEVEL=debug
pnpm mcp:validate
```

## Contributing

### Development Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test:mcp

# Run linting
pnpm lint:mcp

# Build documentation
pnpm docs:build
```

### Adding New Editors

1. Create adapter in `lib/adapters/`
2. Add TypeScript interfaces
3. Implement configuration transformation
4. Add tests and documentation
5. Update build scripts

### Adding New MCP Servers

1. Update base configuration schema
2. Add server-specific validation
3. Update documentation
4. Test across all editors

## Security Considerations

### API Key Management
- Never commit API keys to version control
- Use environment variables exclusively
- Implement key rotation procedures
- Monitor for key leaks in logs

### Configuration Security
- Validate all external inputs
- Sanitize configuration values
- Use secure defaults
- Implement access controls

## Performance Optimization

### Caching Strategy
- Configuration files are cached after first load
- Cache invalidation on file changes
- Environment-specific caching
- Memory-efficient storage

### Loading Performance
- Lazy loading of editor-specific configs
- Parallel validation of multiple configs
- Optimized merge algorithms
- Minimal disk I/O

## Support

### Documentation Links
- [Setup Guide](./SETUP.md)
- [Migration Guide](./MIGRATION.md)
- [API Reference](./API.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Getting Help
- Check troubleshooting guide first
- Review GitHub issues
- Contact development team
- Submit bug reports with debug logs

---

*Last updated: December 2024*
*Version: 1.0.0*