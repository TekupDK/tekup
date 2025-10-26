# MCP Configuration Migration Guide

## Overview

This guide walks you through migrating from legacy MCP configurations to the new centralized configuration management system. The migration process is designed to be safe, reversible, and comprehensive.

## Pre-Migration Assessment

### 1. Inventory Current Configuration

Before starting the migration, understand your current setup:

```bash
# Discover all existing MCP configurations
pnpm mcp:migrate discover

# Or run the discovery manually
node .mcp/scripts/migration-tool.ts discover --detailed
```

This will generate a comprehensive report showing:
- All found MCP configuration files
- Their locations and formats
- Duplicate servers and configurations  
- API keys and environment variables in use
- Editor-specific settings

### 2. Analyze the Discovery Report

Review the generated report (`mcp-discovery-report.json`) to understand:

- **Configuration Files**: All `.windsurf/mcp_servers.json`, `.vscode/settings.json`, etc.
- **Duplicate Servers**: Multiple browser automation setups
- **API Key Usage**: Where keys are currently stored
- **Custom Configurations**: Editor-specific customizations

### 3. Backup Current Configuration

The migration tool automatically creates backups, but it's good practice to create your own:

```bash
# Create manual backup
mkdir -p .mcp/backups/pre-migration/$(date +%Y%m%d_%H%M%S)

# Backup all editor configurations
cp -r .windsurf .mcp/backups/pre-migration/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
cp -r .vscode .mcp/backups/pre-migration/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
cp -r .kiro .mcp/backups/pre-migration/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
cp -r .trae .mcp/backups/pre-migration/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
cp -r .cursor .mcp/backups/pre-migration/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# Backup environment files
cp .env .mcp/backups/pre-migration/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
```

## Migration Process

### Phase 1: Preparation

#### 1.1. Environment Setup

Ensure your environment is properly configured:

```bash
# Verify Node.js and pnpm versions
node --version  # Should be 18+
pnpm --version

# Install migration dependencies
pnpm add -D fs-extra glob path
```

#### 1.2. Configure Environment Variables

Create or update your `.env` file with all required API keys:

```bash
# Create .env from template or existing configurations
cp .env.example .env

# Add all API keys found in discovery
nano .env
```

Ensure all API keys are properly set:
```bash
# Required for most setups
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key

# Browser automation
BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
BROWSER_HEADLESS=true

# Environment
NODE_ENV=development
MCP_CONFIG_ENV=development
```

### Phase 2: Dry Run Migration

Always perform a dry run first to preview changes:

```bash
# Run migration preview
pnpm mcp:migrate --dry-run

# Or use the detailed dry run
node .mcp/scripts/migration-tool.ts migrate --dry-run --verbose
```

Review the dry run output carefully:
- **Files to be created**: New centralized configurations
- **Files to be modified**: Updated editor configurations  
- **Files to be archived**: Legacy configurations
- **Environment variables**: Required additions to `.env`

### Phase 3: Execute Migration

#### 3.1. Run Full Migration

```bash
# Execute the complete migration
pnpm mcp:migrate

# With verbose output for monitoring
pnpm mcp:migrate --verbose
```

#### 3.2. Validate Migration Results

```bash
# Validate all new configurations
pnpm mcp:validate

# Test configuration loading
pnpm mcp:test --dry-run

# Check specific environments
pnpm mcp:validate --env development
pnpm mcp:validate --env staging
pnpm mcp:validate --env production
```

### Phase 4: Editor Integration

#### 4.1. Regenerate Editor Configurations

```bash
# Generate configurations for all editors
pnpm mcp:build

# Or generate for specific editors
pnpm mcp:build --editor windsurf
pnpm mcp:build --editor vscode
pnpm mcp:build --editor kiro
```

#### 4.2. Test Editor Integration

Test each editor individually:

**Windsurf:**
```bash
# Check configuration file
ls -la .windsurf/mcp_servers.json

# Restart Windsurf and verify MCP servers are loaded
```

**VS Code:**
```bash
# Check settings
ls -la .vscode/settings.json

# Restart VS Code and check MCP integration
```

**Other Editors:**
```bash
# Check their respective configuration files
ls -la .kiro/mcp.json
ls -la .trae/mcp_config.json
ls -la .cursor/mcp_servers.json
```

## Specific Migration Scenarios

### Scenario 1: Multiple Browser Automation Setups

If you have multiple browser MCP servers (common in Tekup-org):

#### Before Migration:
```json
// .windsurf/mcp_servers.json
{
  "browser-automation": { "command": "node", "args": ["server1.js"] },
  "browser-control": { "command": "node", "args": ["server2.js"] },
  "web-automation": { "command": "node", "args": ["server3.js"] },
  "browser-tools": { "command": "node", "args": ["server4.js"] }
}
```

#### After Migration:
```json
// .mcp/configs/base.json
{
  "servers": {
    "browser": {
      "command": "npx",
      "args": ["@tekup/browser-mcp"],
      "env": {
        "BROWSER_PATH": "${BROWSER_PATH}",
        "HEADLESS": "${BROWSER_HEADLESS:-true}"
      }
    }
  }
}
```

The migration tool will:
1. Identify all browser-related servers
2. Consolidate them into a single unified configuration
3. Preserve unique features from each implementation
4. Update environment variable references

### Scenario 2: Hardcoded API Keys

#### Before Migration:
```json
{
  "servers": {
    "openai": {
      "env": {
        "OPENAI_API_KEY": "sk-actual-key-here"
      }
    }
  }
}
```

#### After Migration:
```json
{
  "servers": {
    "openai": {
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    }
  }
}
```

The migration will:
1. Detect hardcoded API keys
2. Move them to `.env` file
3. Replace with environment variable references
4. Add security warnings to the migration report

### Scenario 3: Editor-Specific Customizations

#### Before Migration:
```json
// .windsurf/mcp_servers.json
{
  "browser": {
    "command": "node",
    "args": ["browser-server.js"],
    "env": {
      "HEADLESS": "false",
      "DEVTOOLS": "true"
    }
  }
}

// .vscode/settings.json  
{
  "mcp.servers": {
    "browser": {
      "command": "node", 
      "args": ["browser-server.js"],
      "env": {
        "HEADLESS": "true",
        "DEBUG": "false"
      }
    }
  }
}
```

#### After Migration:
```json
// .mcp/configs/base.json
{
  "servers": {
    "browser": {
      "command": "npx",
      "args": ["@tekup/browser-mcp"]
    }
  }
}

// .mcp/configs/development.json
{
  "editorSettings": {
    "windsurf": {
      "servers": {
        "browser": {
          "env": {
            "HEADLESS": "false",
            "DEVTOOLS": "true"
          }
        }
      }
    }
  }
}
```

## Post-Migration Tasks

### 1. Cleanup Legacy Files

After confirming the migration works correctly:

```bash
# Clean up obsolete files
pnpm mcp:clean --obsolete

# Review what will be cleaned
pnpm mcp:clean --obsolete --dry-run

# Clean specific types
pnpm mcp:clean --duplicates
pnpm mcp:clean --empty
pnpm mcp:clean --backups
```

### 2. Update Build Scripts

Ensure your build process uses the new configuration system:

```bash
# Initialize build integration
pnpm mcp:init

# Update package.json scripts
pnpm mcp:init:scripts

# Install pre-commit hooks
pnpm mcp:init:hooks

# Generate CI/CD workflows  
pnpm mcp:init:ci
```

### 3. Test Comprehensive Functionality

Perform end-to-end testing:

```bash
# Full system test
pnpm mcp:test --full

# Test each environment
MCP_CONFIG_ENV=development pnpm mcp:test
MCP_CONFIG_ENV=staging pnpm mcp:test
MCP_CONFIG_ENV=production pnpm mcp:test

# Test each editor
pnpm mcp:test --editor windsurf
pnpm mcp:test --editor vscode
pnpm mcp:test --editor kiro
```

### 4. Documentation Updates

Update any internal documentation that references the old configuration paths:

```bash
# Search for references to old configuration files
grep -r "mcp_servers.json" docs/ README.md || true
grep -r ".windsurf/mcp" docs/ README.md || true

# Update documentation with new paths
# Update internal wikis, setup guides, etc.
```

## Rollback Procedures

If you need to rollback the migration:

### Immediate Rollback

```bash
# Restore from automatic backup
node .mcp/scripts/migration-tool.ts rollback

# Or restore manually from backup directory
cp -r .mcp/backups/migration-YYYYMMDD-HHMMSS/* ./
```

### Selective Rollback

```bash
# Restore specific editor configurations
cp .mcp/backups/migration-YYYYMMDD-HHMMSS/.windsurf/mcp_servers.json .windsurf/
cp .mcp/backups/migration-YYYYMMDD-HHMMSS/.vscode/settings.json .vscode/

# Remove new configuration files
rm -rf .mcp/configs/
```

### Clean Rollback

```bash
# Complete clean rollback
node .mcp/scripts/migration-tool.ts rollback --clean

# This will:
# - Restore all backed up files
# - Remove all new .mcp files
# - Restore original .env file
# - Remove added pnpm scripts
```

## Troubleshooting Migration Issues

### Common Problems

#### Migration Fails with Validation Errors

**Issue**: Configuration validation fails during migration

**Solution**:
```bash
# Check validation errors
pnpm mcp:validate --verbose

# Fix common issues
node .mcp/scripts/migration-tool.ts fix-validation

# Manual fix and re-run
pnpm mcp:migrate --continue
```

#### API Keys Not Working After Migration  

**Issue**: MCP servers can't access API keys

**Solutions**:
```bash
# Check .env file format
cat .env | grep -E "^[A-Z_]+=.*"

# Test environment variable loading
node -e "console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found' : 'Missing')"

# Verify .env is in correct location
ls -la .env

# Check for BOM or encoding issues
file .env
```

#### Editor Doesn't Recognize New Configuration

**Issue**: Editor doesn't load MCP servers after migration

**Solutions**:
```bash
# Regenerate editor configuration
pnpm mcp:build --editor windsurf --force

# Check file exists and has correct format
cat .windsurf/mcp_servers.json | jq '.'

# Restart editor completely
# Check editor logs for errors
```

#### Partial Migration State

**Issue**: Migration partially completed and got interrupted

**Solutions**:
```bash
# Check migration state
node .mcp/scripts/migration-tool.ts status

# Continue partial migration
pnpm mcp:migrate --continue

# Or rollback and start over
node .mcp/scripts/migration-tool.ts rollback
pnpm mcp:migrate
```

### Debug Migration

Enable debug mode for detailed migration logging:

```bash
export MCP_DEBUG=true
export MCP_LOG_LEVEL=debug
pnpm mcp:migrate --verbose
```

### Getting Help

1. **Check Migration Report**: Review `mcp-migration-report.json` for detailed information
2. **Enable Debug Logging**: Use debug mode to get detailed error information  
3. **Validate Step by Step**: Test each component individually
4. **Use Rollback**: When in doubt, rollback and try again
5. **Contact Support**: Include migration report and debug logs

## Migration Checklist

Use this checklist to ensure complete migration:

### Pre-Migration
- [ ] Run discovery tool and review report
- [ ] Backup all current configurations
- [ ] Set up environment variables in `.env`
- [ ] Test dry run migration
- [ ] Review migration plan with team

### Migration
- [ ] Execute migration with verbose logging
- [ ] Validate all generated configurations
- [ ] Test configuration loading in all environments
- [ ] Regenerate editor configurations
- [ ] Test each editor integration

### Post-Migration  
- [ ] Perform comprehensive functionality testing
- [ ] Clean up obsolete configuration files
- [ ] Update build scripts and CI/CD
- [ ] Update documentation and internal guides
- [ ] Train team on new configuration system
- [ ] Monitor for issues in first few days

### Rollback Plan
- [ ] Document rollback procedure
- [ ] Test rollback in staging environment
- [ ] Have emergency contacts ready
- [ ] Plan communication for rollback if needed

---

*Migration Guide Version: 1.0.0*
*Last Updated: December 2024*