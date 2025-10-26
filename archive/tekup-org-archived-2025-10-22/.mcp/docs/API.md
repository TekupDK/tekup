# MCP Configuration API Reference

## Overview

The MCP Configuration Management System provides a comprehensive TypeScript API for loading, validating, and managing MCP configurations across different environments and editors.

## Core API

### Configuration Loader

#### `loadMCPConfig(options?: LoadOptions): Promise<MCPConfig>`

Loads and merges MCP configuration for the specified environment and editor.

```typescript
import { loadMCPConfig, LoadOptions } from '@tekup/mcp-config';

// Load default configuration (current environment)
const config = await loadMCPConfig();

// Load for specific environment
const devConfig = await loadMCPConfig({ 
  environment: 'development' 
});

// Load for specific editor
const windsurfConfig = await loadMCPConfig({ 
  editor: 'windsurf',
  environment: 'production'
});

// Load without validation (faster)
const quickConfig = await loadMCPConfig({ 
  validate: false 
});
```

**Parameters:**
- `options.environment?: string` - Target environment (default: `process.env.NODE_ENV`)
- `options.editor?: string` - Target editor for editor-specific transforms
- `options.validate?: boolean` - Enable configuration validation (default: `true`)
- `options.cache?: boolean` - Enable configuration caching (default: `true`)

**Returns:** `Promise<MCPConfig>` - The merged and validated configuration

**Throws:**
- `ConfigurationError` - When configuration files are missing or invalid
- `ValidationError` - When configuration fails schema validation
- `EnvironmentError` - When required environment variables are missing

---

### Configuration Validation

#### `validateConfig(config: MCPConfig, options?: ValidationOptions): Promise<ValidationResult>`

Validates MCP configuration against the JSON schema and runtime requirements.

```typescript
import { validateConfig, ValidationOptions } from '@tekup/mcp-config';

const config = await loadMCPConfig();
const result = await validateConfig(config);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
  console.warn('Validation warnings:', result.warnings);
}

// Validate with additional checks
const strictResult = await validateConfig(config, {
  checkEnvironmentVariables: true,
  checkServerCommands: true,
  strict: true
});
```

**Parameters:**
- `config: MCPConfig` - Configuration object to validate
- `options.checkEnvironmentVariables?: boolean` - Verify environment variables exist
- `options.checkServerCommands?: boolean` - Verify server commands are available
- `options.strict?: boolean` - Enable strict validation mode
- `options.schema?: object` - Custom JSON schema (default: built-in schema)

**Returns:** `Promise<ValidationResult>`
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  performance: {
    validationTime: number;
    schemaValidationTime: number;
    runtimeValidationTime: number;
  };
}
```

---

### Configuration Watching (Hot Reload)

#### `watchConfig(callback: ConfigChangeCallback, options?: WatchOptions): ConfigWatcher`

Sets up file system watching for configuration changes with hot reload support.

```typescript
import { watchConfig, ConfigChangeCallback } from '@tekup/mcp-config';

const callback: ConfigChangeCallback = (newConfig, changeType, filePath) => {
  console.log(`Configuration ${changeType}:`, filePath);
  console.log('New config:', newConfig);
  
  // Restart MCP servers, update editor settings, etc.
  restartMCPServers(newConfig);
};

const watcher = watchConfig(callback, {
  debounce: 1000,
  environments: ['development', 'staging']
});

// Stop watching
watcher.close();
```

**Parameters:**
- `callback: ConfigChangeCallback` - Function called when configuration changes
- `options.debounce?: number` - Debounce delay in milliseconds (default: 500)
- `options.environments?: string[]` - Environments to watch (default: current only)
- `options.includeEnvFiles?: boolean` - Watch .env files for changes

**Returns:** `ConfigWatcher`
```typescript
interface ConfigWatcher {
  close(): void;
  pause(): void;
  resume(): void;
  isWatching(): boolean;
}
```

---

### Configuration Merging

#### `mergeConfigs(base: MCPConfig, override: Partial<MCPConfig>, options?: MergeOptions): MCPConfig`

Deep merges two configuration objects with customizable merge strategies.

```typescript
import { mergeConfigs, MergeStrategy } from '@tekup/mcp-config';

const baseConfig = await loadMCPConfig({ environment: 'base' });
const devOverrides = await loadMCPConfig({ environment: 'development' });

const mergedConfig = mergeConfigs(baseConfig, devOverrides, {
  arrayMergeStrategy: 'replace',
  environmentVariableExpansion: true
});

// Custom merge strategy
const customMerged = mergeConfigs(baseConfig, devOverrides, {
  customStrategies: [
    {
      key: 'servers.*.env',
      strategy: 'deep-merge'
    }
  ]
});
```

**Parameters:**
- `base: MCPConfig` - Base configuration object
- `override: Partial<MCPConfig>` - Override configuration
- `options.arrayMergeStrategy?: 'replace' | 'merge' | 'append'` - How to handle arrays
- `options.environmentVariableExpansion?: boolean` - Expand environment variables
- `options.customStrategies?: MergeStrategy[]` - Custom merge strategies

---

## Editor Adapters API

### Base Adapter Interface

All editor adapters implement the `EditorAdapter` interface:

```typescript
interface EditorAdapter {
  name: string;
  configPath: string;
  transform(config: MCPConfig): Promise<EditorSpecificConfig>;
  validate(config: EditorSpecificConfig): Promise<ValidationResult>;
  install(config: EditorSpecificConfig): Promise<void>;
  uninstall(): Promise<void>;
}
```

### Windsurf Adapter

#### `WindsurfAdapter`

```typescript
import { WindsurfAdapter } from '@tekup/mcp-config/adapters';

const adapter = new WindsurfAdapter({
  configPath: '.windsurf/mcp_servers.json',
  backupOriginal: true
});

const config = await loadMCPConfig();
const windsurfConfig = await adapter.transform(config);
await adapter.install(windsurfConfig);
```

**Windsurf Configuration Format:**
```typescript
interface WindsurfConfig {
  [serverName: string]: {
    command: string;
    args: string[];
    env?: Record<string, string>;
    cwd?: string;
  };
}
```

### VS Code Adapter

#### `VSCodeAdapter`

```typescript
import { VSCodeAdapter } from '@tekup/mcp-config/adapters';

const adapter = new VSCodeAdapter({
  settingsPath: '.vscode/settings.json',
  workspaceLevel: true
});

const config = await loadMCPConfig();
await adapter.install(await adapter.transform(config));
```

**VS Code Configuration Format:**
```typescript
interface VSCodeConfig {
  "mcp.servers": {
    [serverName: string]: {
      command: string;
      args: string[];
      env?: Record<string, string>;
    };
  };
}
```

---

## Utility Functions

### Environment Variable Expansion

#### `expandEnvironmentVariables(config: MCPConfig): MCPConfig`

Expands environment variable references in configuration objects.

```typescript
import { expandEnvironmentVariables } from '@tekup/mcp-config/utils';

const configWithVars = {
  servers: {
    openai: {
      env: {
        OPENAI_API_KEY: '${OPENAI_API_KEY}',
        TIMEOUT: '${MCP_TIMEOUT:-30000}'
      }
    }
  }
};

const expandedConfig = expandEnvironmentVariables(configWithVars);
// Result: OPENAI_API_KEY will be actual key value, TIMEOUT will be 30000 if MCP_TIMEOUT is not set
```

### Configuration Cache Management

#### `ConfigCache`

```typescript
import { ConfigCache } from '@tekup/mcp-config/cache';

const cache = new ConfigCache({
  ttl: 3600000, // 1 hour
  maxSize: 100
});

// Manual cache operations
cache.set('development', config);
const cached = cache.get('development');
cache.clear();
```

### Schema Generation

#### `generateSchema(config: MCPConfig): object`

Generates JSON schema from configuration object.

```typescript
import { generateSchema } from '@tekup/mcp-config/schema';

const config = await loadMCPConfig();
const schema = generateSchema(config);

// Use for validation or documentation
```

---

## Error Handling

### Error Types

#### `ConfigurationError`

Thrown when configuration files cannot be loaded or are malformed.

```typescript
import { ConfigurationError } from '@tekup/mcp-config';

try {
  const config = await loadMCPConfig();
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Configuration issue:', error.message);
    console.error('File path:', error.filePath);
    console.error('Line:', error.line);
  }
}
```

#### `ValidationError`

Thrown when configuration fails validation.

```typescript
import { ValidationError } from '@tekup/mcp-config';

try {
  await validateConfig(config);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.errors);
    console.error('Schema path:', error.schemaPath);
  }
}
```

#### `EnvironmentError`

Thrown when required environment variables are missing.

```typescript
import { EnvironmentError } from '@tekup/mcp-config';

try {
  const config = await loadMCPConfig();
} catch (error) {
  if (error instanceof EnvironmentError) {
    console.error('Missing environment variables:', error.missingVariables);
    console.error('Available variables:', error.availableVariables);
  }
}
```

---

## Type Definitions

### Core Types

```typescript
interface MCPConfig {
  version: string;
  metadata: ConfigMetadata;
  servers: Record<string, MCPServer>;
  globalSettings: GlobalSettings;
  editorSettings?: Record<string, EditorSettings>;
}

interface ConfigMetadata {
  name: string;
  description?: string;
  lastUpdated?: string;
  author?: string;
  version?: string;
}

interface MCPServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
  timeout?: number;
  retryCount?: number;
  healthCheck?: HealthCheckConfig;
  disabled?: boolean;
}

interface GlobalSettings {
  timeout: number;
  retryCount: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableHealthChecks?: boolean;
  healthCheckInterval?: number;
  maxConcurrentServers?: number;
}

interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  retries: number;
  endpoint?: string;
  expectedStatus?: number;
}
```

### Environment-Specific Types

```typescript
interface EnvironmentConfig extends Partial<MCPConfig> {
  extends?: string;
  overrides?: ConfigOverrides;
  editorSpecific?: Record<string, Partial<MCPConfig>>;
}

interface ConfigOverrides {
  servers?: Record<string, Partial<MCPServer>>;
  globalSettings?: Partial<GlobalSettings>;
  add?: {
    servers?: Record<string, MCPServer>;
  };
  remove?: {
    servers?: string[];
  };
}
```

### Loading and Validation Types

```typescript
interface LoadOptions {
  environment?: string;
  editor?: string;
  validate?: boolean;
  cache?: boolean;
  expandVariables?: boolean;
  includeMeta?: boolean;
}

interface ValidationOptions {
  checkEnvironmentVariables?: boolean;
  checkServerCommands?: boolean;
  strict?: boolean;
  schema?: object;
  ignoreWarnings?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  performance: ValidationPerformance;
}

interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  suggestion?: string;
}
```

---

## CLI Integration

### Programmatic CLI Usage

```typescript
import { CLI } from '@tekup/mcp-config/cli';

const cli = new CLI();

// Run validation programmatically
const validationResult = await cli.validate({
  environment: 'development',
  verbose: true
});

// Build configurations
await cli.build({
  editor: 'windsurf',
  force: true
});

// Migration operations
const migrationResult = await cli.migrate({
  dryRun: false,
  backup: true
});
```

---

## Performance Considerations

### Caching

Configuration loading supports multiple caching strategies:

```typescript
// Memory cache (default)
const config = await loadMCPConfig({ cache: true });

// Disable cache for development
const freshConfig = await loadMCPConfig({ cache: false });

// Custom cache implementation
const customCache = new ConfigCache({ ttl: 60000 });
const configLoader = new ConfigLoader({ cache: customCache });
```

### Lazy Loading

```typescript
import { LazyConfigLoader } from '@tekup/mcp-config/lazy';

const lazyLoader = new LazyConfigLoader();

// Configurations are loaded on first access
const config = await lazyLoader.getConfig('development');
const servers = await lazyLoader.getServers('browser');
```

### Streaming Configuration

For large configurations:

```typescript
import { StreamConfigLoader } from '@tekup/mcp-config/stream';

const stream = new StreamConfigLoader();
const configStream = stream.loadConfig('production');

configStream.on('server', (serverName, serverConfig) => {
  console.log(`Loaded server: ${serverName}`);
});

configStream.on('complete', (fullConfig) => {
  console.log('Configuration loading complete');
});
```

---

## Advanced Usage

### Custom Merge Strategies

```typescript
import { registerMergeStrategy } from '@tekup/mcp-config/merge';

// Register custom array merge strategy
registerMergeStrategy({
  name: 'smart-array-merge',
  canHandle: (key, baseValue, overrideValue) => {
    return Array.isArray(baseValue) && Array.isArray(overrideValue);
  },
  merge: (key, baseArray, overrideArray) => {
    // Custom merge logic
    return [...new Set([...baseArray, ...overrideArray])];
  }
});
```

### Plugin System

```typescript
import { PluginManager } from '@tekup/mcp-config/plugins';

const pluginManager = new PluginManager();

// Register custom plugin
pluginManager.register({
  name: 'custom-validator',
  hooks: {
    beforeValidation: (config) => {
      // Custom pre-validation logic
    },
    afterValidation: (result) => {
      // Custom post-validation logic
    }
  }
});
```

### Configuration Transformers

```typescript
import { ConfigTransformer } from '@tekup/mcp-config/transform';

const transformer = new ConfigTransformer();

// Add transformation rules
transformer.addRule({
  selector: 'servers.*.env.OPENAI_API_KEY',
  transform: (value) => {
    // Ensure API key format
    return value.startsWith('sk-') ? value : `sk-${value}`;
  }
});

const transformedConfig = transformer.apply(config);
```

---

*API Reference Version: 1.0.0*
*Last Updated: December 2024*