# MCP Configuration Troubleshooting Guide

## Quick Diagnosis

Start with these commands to quickly identify common issues:

```bash
# Run comprehensive system check
pnpm mcp:doctor

# Check configuration validity
pnpm mcp:validate --verbose

# Test environment variables
pnpm mcp:test --env-check

# Generate debug report
pnpm mcp:debug-report
```

## Common Issues and Solutions

### Configuration Loading Issues

#### Issue: Configuration Not Found
**Symptoms**: `Error: Configuration file not found` or `ENOENT` errors

**Causes**:
- Missing configuration files
- Incorrect file paths
- Permission issues

**Solutions**:
```bash
# Check if configuration files exist
ls -la .mcp/configs/

# Verify current working directory
pwd

# Check file permissions
ls -la .mcp/configs/base.json

# Regenerate missing configurations
pnpm mcp:init --force

# Create missing base configuration
cat > .mcp/configs/base.json << 'EOF'
{
  "version": "1.0.0",
  "metadata": {
    "name": "Tekup MCP Configuration"
  },
  "servers": {},
  "globalSettings": {
    "timeout": 30000,
    "logLevel": "info"
  }
}
EOF
```

#### Issue: Configuration Validation Errors
**Symptoms**: Schema validation failures, type errors

**Common Validation Errors**:
```bash
# Invalid JSON syntax
Error: Unexpected token in JSON at position X

# Missing required fields
Error: Missing required property 'version'

# Invalid server configuration
Error: Server 'browser' missing required 'command' field

# Invalid environment variable reference
Error: Invalid environment variable syntax '${INVALID_VAR'
```

**Solutions**:
```bash
# Validate JSON syntax
cat .mcp/configs/base.json | jq '.'

# Use schema validation with details
pnpm mcp:validate --schema --verbose

# Fix common schema issues
node .mcp/scripts/migration-tool.ts fix-validation

# Validate specific environment
pnpm mcp:validate --env development --detailed
```

### Environment Variable Issues

#### Issue: API Keys Not Recognized
**Symptoms**: Server authentication failures, "API key not found" errors

**Debugging Steps**:
```bash
# Check if .env file exists and is readable
ls -la .env
file .env

# Verify environment variable format (should not show actual keys)
grep -E '^[A-Z_]+=.*' .env | sed 's/=.*/=***/'

# Test environment variable loading
node -e "console.log({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Found' : 'Missing',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'Found' : 'Missing',
  NODE_ENV: process.env.NODE_ENV || 'undefined'
})"

# Check for BOM or encoding issues
xxd .env | head -n 1
```

**Solutions**:
```bash
# Fix .env file encoding
dos2unix .env  # On Unix systems

# Remove BOM if present
sed -i '1s/^\xEF\xBB\xBF//' .env

# Ensure proper format (no spaces around =)
sed -i 's/ *= */=/g' .env
sed -i 's/= */=/g' .env

# Test specific environment variable
export OPENAI_API_KEY="your-key-here"
node -e "console.log('Test:', process.env.OPENAI_API_KEY ? 'OK' : 'Failed')"
```

#### Issue: Environment Variable Expansion Failures
**Symptoms**: Variables show as literal `${VAR_NAME}` instead of values

**Causes**:
- Incorrect variable syntax
- Missing environment variables
- Shell expansion issues

**Solutions**:
```bash
# Check variable expansion syntax
grep -E '\$\{[^}]+\}' .mcp/configs/base.json

# Test expansion manually
node -e "
const config = require('./.mcp/configs/base.json');
console.log('Raw config:', JSON.stringify(config.servers.browser?.env, null, 2));
"

# Fix expansion in configuration loader
pnpm mcp:test --expansion-check

# Set missing environment variables
echo "MISSING_VAR=default_value" >> .env
```

### Editor Integration Issues

#### Issue: Windsurf Not Loading MCP Servers
**Symptoms**: MCP servers don't appear in Windsurf, no MCP functionality

**Debugging Steps**:
```bash
# Check Windsurf configuration file
ls -la .windsurf/mcp_servers.json
cat .windsurf/mcp_servers.json | jq '.'

# Verify Windsurf MCP server format
node -e "
const config = require('./.windsurf/mcp_servers.json');
console.log('Servers found:', Object.keys(config));
console.log('Config valid:', typeof config === 'object');
"

# Check Windsurf logs (adjust path for your system)
tail -f ~/.windsurf/logs/main.log
tail -f ~/AppData/Local/Windsurf/logs/main.log  # Windows
```

**Solutions**:
```bash
# Regenerate Windsurf configuration
pnpm mcp:build --editor windsurf --force

# Validate Windsurf configuration format
node .mcp/lib/adapters/windsurf.ts validate

# Restart Windsurf completely
taskkill /f /im Windsurf.exe  # Windows
killall Windsurf  # macOS/Linux

# Check for Windsurf MCP extension
# Verify MCP extension is installed and enabled in Windsurf
```

#### Issue: VS Code MCP Integration Problems
**Symptoms**: VS Code doesn't recognize MCP settings

**Solutions**:
```bash
# Check VS Code settings
cat .vscode/settings.json | jq '.mcp'

# Verify MCP extension installation
code --list-extensions | grep -i mcp

# Install required MCP extension
code --install-extension your-mcp-extension-id

# Check VS Code user vs workspace settings
code .vscode/settings.json

# Reload VS Code window
# Ctrl+Shift+P -> Developer: Reload Window
```

### Server Connection Issues

#### Issue: MCP Server Fails to Start
**Symptoms**: Server timeout errors, connection refused

**Common Server Errors**:
```
Error: spawn ENOENT (command not found)
Error: Server timeout after 30000ms
Error: Connection refused on port 3000
```

**Debugging Steps**:
```bash
# Test server command manually
npx @tekup/browser-mcp --version

# Check if required dependencies are installed
pnpm list @tekup/browser-mcp
pnpm list @modelcontextprotocol/server-openai

# Test server startup manually
node -e "
const { spawn } = require('child_process');
const server = spawn('npx', ['@tekup/browser-mcp'], { stdio: 'inherit' });
server.on('error', err => console.error('Server error:', err));
server.on('exit', code => console.log('Server exited with code:', code));
setTimeout(() => server.kill(), 5000);
"
```

**Solutions**:
```bash
# Install missing MCP servers
pnpm add @tekup/browser-mcp
pnpm add @modelcontextprotocol/server-openai
pnpm add @modelcontextprotocol/server-anthropic

# Fix command paths
which npx
which node

# Update server timeout in configuration
# Edit .mcp/configs/base.json and increase timeout values

# Check network connectivity
curl -I https://api.openai.com/v1/models
curl -I https://api.anthropic.com/v1/messages
```

#### Issue: Browser Automation Server Problems
**Symptoms**: Browser doesn't open, automation commands fail

**Browser-Specific Debugging**:
```bash
# Check browser path
ls -la "C:\Program Files\Google\Chrome\Application\chrome.exe"
ls -la "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Test browser launch manually
"C:\Program Files\Google\Chrome\Application\chrome.exe" --version  # Windows
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version  # macOS

# Check environment variables
echo $BROWSER_PATH
echo $BROWSER_HEADLESS

# Test browser automation server
MCP_DEBUG=true pnpm mcp:test --server browser
```

**Solutions**:
```bash
# Fix browser path in environment
echo 'BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe' >> .env  # Windows
echo 'BROWSER_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' >> .env  # macOS

# Install required browser dependencies
pnpm add puppeteer
pnpm add playwright

# Set browser options for development
echo 'BROWSER_HEADLESS=false' >> .env
echo 'BROWSER_DEVTOOLS=true' >> .env
```

### Performance Issues

#### Issue: Slow Configuration Loading
**Symptoms**: Long delays when starting editors, timeout errors

**Debugging Performance**:
```bash
# Benchmark configuration loading
pnpm mcp:test --benchmark

# Profile memory usage
node --inspect .mcp/lib/loader.ts

# Check file system performance
time cat .mcp/configs/base.json
time pnpm mcp:validate
```

**Solutions**:
```bash
# Clear configuration cache
pnpm mcp:cache --clear

# Reduce configuration size
# Remove unused servers from base.json

# Optimize file I/O
# Use SSD instead of HDD for configuration files
# Check disk space and fragmentation

# Increase cache TTL for production
echo 'MCP_CACHE_TTL=3600' >> .env
```

#### Issue: Memory Leaks in Hot Reload
**Symptoms**: Memory usage increases over time during development

**Debugging**:
```bash
# Monitor memory usage
node --expose-gc -e "
setInterval(() => {
  global.gc();
  const used = process.memoryUsage();
  console.log('Memory usage:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
}, 5000);
setTimeout(() => process.exit(0), 60000);
"

# Profile memory leaks
node --inspect --expose-gc .mcp/lib/loader.ts
```

**Solutions**:
```bash
# Disable hot reload in production
echo 'MCP_HOT_RELOAD=false' >> .env

# Restart development server periodically
# Use pm2 or similar process manager with restart policies

# Optimize file watchers
# Reduce number of watched files
echo 'MCP_WATCH_DEBOUNCE=1000' >> .env
```

### Build and CI/CD Issues

#### Issue: MCP Validation Fails in CI
**Symptoms**: Build passes locally but fails in CI environment

**Common CI Issues**:
```yaml
# Missing environment variables in CI
Error: OPENAI_API_KEY is not defined

# File permission issues
Error: EACCES: permission denied, open '.mcp/configs/base.json'

# Path differences between local and CI
Error: Cannot find module '.mcp/lib/loader'
```

**Solutions**:
```bash
# Check CI environment variables
# Add all required variables to CI settings

# Fix file permissions in CI
chmod -R 755 .mcp/
chmod 644 .mcp/configs/*.json

# Use relative paths in CI
sed -i 's|/absolute/path/to|./|g' .mcp/configs/base.json

# Add MCP validation to CI workflow
# See .github/workflows/mcp-validation.yml
```

#### Issue: Pre-commit Hooks Failing
**Symptoms**: Commits blocked by MCP validation errors

**Solutions**:
```bash
# Check hook installation
ls -la .git/hooks/pre-commit

# Test hooks manually
.git/hooks/pre-commit

# Update hooks
pnpm mcp:init:hooks --force

# Skip hooks temporarily (emergency only)
git commit -m "fix: urgent fix" --no-verify

# Fix validation issues
pnpm mcp:validate --fix
```

## Advanced Debugging

### Enable Debug Mode

```bash
# Set debug environment variables
export MCP_DEBUG=true
export MCP_LOG_LEVEL=debug
export MCP_VERBOSE=true

# Run commands with debug output
pnpm mcp:validate --verbose
pnpm mcp:test --debug
```

### Logging Configuration

```bash
# Enable file logging
export MCP_LOG_FILE=.mcp/logs/debug.log
mkdir -p .mcp/logs

# View real-time logs
tail -f .mcp/logs/debug.log

# Parse JSON logs
cat .mcp/logs/debug.log | jq '.level | select(. == "error")'
```

### Network Debugging

```bash
# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
curl -H "x-api-key: $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages

# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Test with proxy bypass
NO_PROXY=* pnpm mcp:test --server openai
```

### File System Debugging

```bash
# Check disk space
df -h

# Check file descriptors
lsof | grep mcp

# Monitor file changes
inotifywait -mr .mcp/configs/

# Check file locking
lsof .mcp/configs/base.json
```

## Emergency Procedures

### Quick Reset

If everything is broken and you need to start fresh:

```bash
# Complete reset (destructive)
rm -rf .mcp/
pnpm mcp:init --force
pnpm mcp:validate
pnpm mcp:build
```

### Rollback to Working State

```bash
# Restore from backup
cp -r .mcp/backups/latest/* ./

# Or restore from git
git checkout HEAD -- .mcp/
git checkout HEAD -- .windsurf/mcp_servers.json
git checkout HEAD -- .vscode/settings.json
```

### Minimal Working Configuration

Create a minimal configuration to test basic functionality:

```bash
cat > .mcp/configs/base.json << 'EOF'
{
  "version": "1.0.0",
  "metadata": {
    "name": "Minimal MCP Configuration"
  },
  "servers": {
    "test": {
      "command": "echo",
      "args": ["Hello, MCP!"]
    }
  },
  "globalSettings": {
    "timeout": 5000,
    "logLevel": "info"
  }
}
EOF

# Test minimal configuration
pnpm mcp:validate
pnpm mcp:test --server test
```

## Getting Support

### Before Contacting Support

1. **Run diagnostics**:
   ```bash
   pnpm mcp:doctor > mcp-diagnostics.txt
   ```

2. **Collect debug information**:
   ```bash
   pnpm mcp:debug-report --detailed > debug-report.json
   ```

3. **Check recent changes**:
   ```bash
   git log --oneline -10 -- .mcp/
   ```

### Support Information to Include

- Operating system and version
- Node.js and pnpm versions
- Editor and version
- Complete error messages
- Debug report (without API keys)
- Recent configuration changes

### Contact Channels

1. **Documentation**: Check all docs in `.mcp/docs/`
2. **GitHub Issues**: Include debug report and reproduction steps
3. **Team Chat**: For urgent production issues
4. **Email Support**: Include all diagnostic information

---

*Troubleshooting Guide Version: 1.0.0*
*Last Updated: December 2024*