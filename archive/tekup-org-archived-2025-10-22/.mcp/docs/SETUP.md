# MCP Configuration Setup Guide

## Prerequisites

Before setting up the MCP Configuration Management System, ensure you have:

- **Node.js**: Version 18 or higher
- **pnpm**: Latest version (recommended over npm/yarn)
- **Git**: For version control and CI/CD integration
- **Supported Editors**: Windsurf, VS Code, Kiro, Trae, or Cursor

## Installation

### 1. Initial Setup

Navigate to your Tekup monorepo root and ensure the MCP configuration system is properly structured:

```bash
# Verify you're in the correct directory
pwd
# Should output: /path/to/Tekup-org

# Check if .mcp directory exists
ls -la .mcp/
```

### 2. Install Dependencies

Install the required dependencies for the MCP configuration system:

```bash
# Install main dependencies
pnpm install

# Install MCP-specific dependencies (if not already installed)
pnpm add -D @types/node typescript ts-node
pnpm add jsonschema fs-extra chokidar
```

### 3. Environment Configuration

#### Copy Environment Template

```bash
# Copy the environment template
cp .env.example .env

# Or create a new .env file
touch .env
```

#### Configure Required Environment Variables

Edit your `.env` file with the following required variables:

```bash
# Environment Configuration
NODE_ENV=development
MCP_CONFIG_ENV=development

# API Keys (replace with your actual keys)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-your-anthropic-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here

# Browser Configuration
BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
BROWSER_HEADLESS=true

# Optional: Logging Configuration
MCP_LOG_LEVEL=info
MCP_DEBUG=false
```

#### Secure Environment Variables

```bash
# Set appropriate permissions (Unix/Linux/macOS)
chmod 600 .env

# Add .env to .gitignore if not already present
echo ".env" >> .gitignore
```

### 4. Initialize MCP Configuration

#### Run Build Integration Setup

```bash
# Initialize the complete build integration
pnpm mcp:init

# Or run individual initialization steps
pnpm mcp:init:scripts
pnpm mcp:init:hooks
pnpm mcp:init:ci
```

This will:
- Add MCP scripts to package.json
- Install pre-commit hooks
- Generate CI/CD workflow files
- Create initial configuration files if they don't exist

#### Validate Installation

```bash
# Validate all configurations
pnpm mcp:validate

# Check environment variables
pnpm mcp:test --env-check

# Test configuration loading
pnpm mcp:test --dry-run
```

### 5. Editor Setup

#### Windsurf

1. **Automatic Setup** (Recommended):
```bash
# Generate Windsurf configuration
pnpm mcp:build --editor windsurf
```

2. **Manual Setup**:
   - The configuration will be automatically placed in `.windsurf/mcp_servers.json`
   - Windsurf will detect the configuration on next startup

#### VS Code

1. **Install MCP Extension** (if available):
   ```bash
   code --install-extension your-mcp-extension
   ```

2. **Configure Settings**:
   ```bash
   # Generate VS Code configuration
   pnpm mcp:build --editor vscode
   ```

3. **Manual Configuration**:
   Add to `.vscode/settings.json`:
   ```json
   {
     "mcp.configPath": ".mcp/configs",
     "mcp.environment": "development"
   }
   ```

#### Kiro

1. **Generate Configuration**:
   ```bash
   pnpm mcp:build --editor kiro
   ```

2. **Manual Setup**:
   - Configuration will be placed in `.kiro/mcp.json`
   - Restart Kiro to load new configuration

#### Trae

1. **Generate Configuration**:
   ```bash
   pnpm mcp:build --editor trae
   ```

2. **Configuration Location**: `.trae/mcp_config.json`

#### Cursor

1. **Generate Configuration**:
   ```bash
   pnpm mcp:build --editor cursor
   ```

2. **Configuration Location**: `.cursor/mcp_servers.json`

## Configuration

### Base Configuration

The base configuration file (`.mcp/configs/base.json`) contains default settings for all environments:

```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "Tekup MCP Configuration",
    "description": "Centralized MCP configuration for Tekup monorepo",
    "lastUpdated": "2024-12-15T00:00:00Z"
  },
  "servers": {
    "browser": {
      "command": "npx",
      "args": ["@tekup/browser-mcp"],
      "env": {
        "BROWSER_PATH": "${BROWSER_PATH}",
        "HEADLESS": "${BROWSER_HEADLESS:-true}"
      },
      "timeout": 30000,
      "retryCount": 3
    },
    "openai": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-openai"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    },
    "anthropic": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-anthropic"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  },
  "globalSettings": {
    "timeout": 30000,
    "retryCount": 3,
    "logLevel": "info",
    "enableHealthChecks": true,
    "healthCheckInterval": 60000
  }
}
```

### Environment-Specific Overrides

#### Development Configuration (`.mcp/configs/development.json`)

```json
{
  "extends": "base",
  "servers": {
    "browser": {
      "env": {
        "HEADLESS": "false",
        "DEBUG": "true",
        "DEVTOOLS": "true"
      }
    }
  },
  "globalSettings": {
    "logLevel": "debug",
    "timeout": 60000,
    "enableHealthChecks": false
  }
}
```

#### Staging Configuration (`.mcp/configs/staging.json`)

```json
{
  "extends": "base",
  "globalSettings": {
    "logLevel": "warn",
    "enableHealthChecks": true,
    "healthCheckInterval": 30000
  }
}
```

#### Production Configuration (`.mcp/configs/production.json`)

```json
{
  "extends": "base",
  "globalSettings": {
    "logLevel": "error",
    "timeout": 15000,
    "retryCount": 5,
    "enableHealthChecks": true,
    "healthCheckInterval": 15000
  }
}
```

## Testing Installation

### Basic Tests

```bash
# Test configuration loading
pnpm mcp:test

# Test specific environment
pnpm mcp:test --env staging

# Test specific editor
pnpm mcp:test --editor windsurf

# Test API key validation
pnpm mcp:test --keys-only
```

### Advanced Tests

```bash
# Test hot reload functionality
pnpm mcp:test --hot-reload

# Performance benchmarks
pnpm mcp:test --benchmark

# Integration tests
pnpm mcp:test --integration

# Full system test
pnpm mcp:test --full
```

### Manual Testing

#### Test Browser MCP Server

1. **Start Browser Server**:
   ```bash
   # Test in development mode
   MCP_CONFIG_ENV=development pnpm mcp:test --server browser
   ```

2. **Verify Browser Automation**:
   - Open your editor (e.g., Windsurf)
   - Try browser automation commands
   - Check that browser opens correctly

#### Test API Integration

1. **Test OpenAI Integration**:
   ```bash
   pnpm mcp:test --server openai
   ```

2. **Test Anthropic Integration**:
   ```bash
   pnpm mcp:test --server anthropic
   ```

3. **Verify API Key Loading**:
   ```bash
   # This should not display actual keys
   pnpm mcp:test --env-vars
   ```

## Troubleshooting Setup

### Common Issues

#### Configuration Not Loading

**Symptoms**: Editor doesn't recognize MCP servers

**Solutions**:
```bash
# Check configuration validity
pnpm mcp:validate

# Regenerate editor configurations
pnpm mcp:build --force

# Check file permissions
ls -la .mcp/configs/
```

#### Environment Variables Not Working

**Symptoms**: API keys not recognized, servers fail to start

**Solutions**:
```bash
# Check environment variable loading
pnpm mcp:test --env-check

# Verify .env file exists and has correct format
cat .env | grep -v "^#"

# Test environment variable expansion
node -e "console.log(process.env.OPENAI_API_KEY ? 'OK' : 'Missing')"
```

#### Editor Integration Failures

**Symptoms**: Editor doesn't show MCP servers in configuration

**Solutions**:
```bash
# Check editor-specific configuration
ls -la .windsurf/mcp_servers.json  # For Windsurf
ls -la .vscode/settings.json       # For VS Code

# Regenerate editor configuration
pnpm mcp:build --editor windsurf --force

# Check editor logs
tail -f ~/.windsurf/logs/mcp.log   # Adjust path as needed
```

#### Build Script Issues

**Symptoms**: pnpm mcp:* commands not working

**Solutions**:
```bash
# Check if scripts were added to package.json
grep "mcp:" package.json

# Reinstall build integration
pnpm mcp:init:scripts --force

# Run scripts directly
node .mcp/scripts/build-integration.ts validate
```

### Debug Mode

Enable debug mode for detailed troubleshooting:

```bash
# Enable debug logging
export MCP_DEBUG=true
export MCP_LOG_LEVEL=debug

# Run validation with debug output
pnpm mcp:validate

# Test with verbose output
pnpm mcp:test --verbose
```

### Getting Help

1. **Check Documentation**: Review [README.md](./README.md) and [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

2. **Validate Setup**:
   ```bash
   pnpm mcp:doctor  # Comprehensive system check
   ```

3. **Generate Debug Report**:
   ```bash
   pnpm mcp:debug-report  # Creates detailed system report
   ```

4. **Contact Support**: Include debug report when seeking help

## Next Steps

After successful installation:

1. **Customize Configuration**: Modify base and environment configurations as needed
2. **Set Up CI/CD**: Configure automated testing and deployment
3. **Train Team**: Share setup guide with team members
4. **Monitor Performance**: Set up monitoring for configuration loading times
5. **Plan Migrations**: If migrating from existing MCP setups, use migration tools

## Advanced Setup

### Custom Editor Integration

If you're using an editor not listed above:

1. **Create Custom Adapter**:
   ```bash
   # Copy existing adapter as template
   cp .mcp/lib/adapters/windsurf.ts .mcp/lib/adapters/your-editor.ts
   ```

2. **Implement Adapter Interface**:
   ```typescript
   export class YourEditorAdapter implements EditorAdapter {
     name = 'your-editor';
     configPath = '.your-editor/mcp.json';
     
     transform(config: MCPConfig): YourEditorConfig {
       // Transform logic
     }
   }
   ```

3. **Register Adapter**:
   ```typescript
   // In .mcp/lib/adapters/index.ts
   export { YourEditorAdapter } from './your-editor';
   ```

### Custom MCP Servers

To add custom MCP servers:

1. **Update Base Configuration**:
   ```json
   {
     "servers": {
       "your-server": {
         "command": "node",
         "args": ["./path/to/your-server.js"],
         "env": {
           "YOUR_API_KEY": "${YOUR_API_KEY}"
         }
       }
     }
   }
   ```

2. **Add Environment Variables**:
   ```bash
   echo "YOUR_API_KEY=your-key-here" >> .env
   ```

3. **Test Configuration**:
   ```bash
   pnpm mcp:validate
   pnpm mcp:test --server your-server
   ```

---

*Setup Guide Version: 1.0.0*
*Last Updated: December 2024*