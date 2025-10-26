/**
 * @fileoverview TypeScript definitions for TekUp MCP configuration schemas
 * 
 * This module provides type definitions and utilities for working with MCP
 * configurations in the TekUp.org monorepo. It re-exports types from the
 * shared package and provides local utilities.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

// Re-export all configuration types from @tekup/shared
export * from '@tekup/shared/mcp/configuration';

// Re-export base MCP types
export * from '@tekup/shared/mcp';

import { 
  TekUpMCPConfig,
  MCPEnvironment,
  MCPConfigLoadOptions,
  MCPConfigValidationResult,
  MCPConfigLoadingError,
  TekUpMCPServer,
  MCPEditorType
} from '@tekup/shared/mcp/configuration';

// =============================================================================
// LOCAL TYPE DEFINITIONS
// =============================================================================

/**
 * MCP configuration file paths
 */
export interface MCPConfigPaths {
  /** Base configuration directory */
  baseDir: string;
  
  /** Configuration files */
  configs: {
    base: string;
    development: string;
    staging: string;
    production: string;
  };
  
  /** Schema files */
  schemas: {
    main: string;
    types: string;
  };
  
  /** Script files */
  scripts: {
    loader: string;
    validator: string;
    merger: string;
    migrator: string;
  };
  
  /** Adapter files */
  adapters: Record<MCPEditorType, string>;
  
  /** Documentation files */
  docs: {
    architecture: string;
    configuration: string;
    migration: string;
  };
  
  /** Log directory */
  logs: string;
}

/**
 * MCP configuration constants
 */
export const MCP_CONFIG_CONSTANTS = {
  /** Default configuration directory name */
  CONFIG_DIR: '.mcp',
  
  /** Configuration file names */
  CONFIG_FILES: {
    BASE: 'base.json',
    DEVELOPMENT: 'development.json',
    STAGING: 'staging.json',
    PRODUCTION: 'production.json'
  },
  
  /** Schema file names */
  SCHEMA_FILES: {
    MAIN: 'mcp-config.schema.json',
    TYPES: 'types.ts'
  },
  
  /** Default environment */
  DEFAULT_ENVIRONMENT: 'development' as MCPEnvironment,
  
  /** Environment variable names */
  ENV_VARS: {
    ENVIRONMENT: 'MCP_ENVIRONMENT',
    BROWSER_PORT: 'MCP_BROWSER_PORT',
    WORKSPACE_ROOT: 'MCP_FILESYSTEM_WORKSPACE_ROOT',
    BRAVE_API_KEY: 'MCP_BRAVE_API_KEY',
    BILLY_API_TOKEN: 'MCP_BILLY_API_TOKEN',
    ZAPIER_ENDPOINT: 'MCP_ZAPIER_ENDPOINT'
  },
  
  /** Default values */
  DEFAULTS: {
    BROWSER_PORT: '3030',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    HEALTH_CHECK_INTERVAL: 60000,
    CACHE_TTL: 300000 // 5 minutes
  }
} as const;

/**
 * MCP server type discriminators
 */
export type MCPServerType = 
  | 'browser'
  | 'filesystem' 
  | 'search'
  | 'automation'
  | 'billing'
  | 'custom';

/**
 * Configuration loading context
 */
export interface MCPConfigContext {
  /** Current environment */
  environment: MCPEnvironment;
  
  /** Configuration directory path */
  configDir: string;
  
  /** Workspace root path */
  workspaceRoot: string;
  
  /** Environment variables */
  envVars: Record<string, string>;
  
  /** Loading timestamp */
  loadedAt: Date;
  
  /** Configuration file paths */
  paths: MCPConfigPaths;
}

/**
 * Server health status
 */
export interface MCPServerHealth {
  /** Server ID */
  serverId: string;
  
  /** Health status */
  status: 'healthy' | 'unhealthy' | 'unknown';
  
  /** Last health check timestamp */
  lastCheck: Date;
  
  /** Response time in milliseconds */
  responseTime?: number;
  
  /** Error message (if unhealthy) */
  error?: string;
  
  /** Additional health metrics */
  metrics?: Record<string, any>;
}

/**
 * Configuration change event
 */
export interface MCPConfigChangeEvent {
  /** Event type */
  type: 'config_changed' | 'server_added' | 'server_removed' | 'server_updated';
  
  /** Timestamp */
  timestamp: Date;
  
  /** Changed configuration path */
  path?: string;
  
  /** Affected server ID */
  serverId?: string;
  
  /** Old value (for updates) */
  oldValue?: any;
  
  /** New value */
  newValue?: any;
  
  /** Change metadata */
  metadata?: Record<string, any>;
}

/**
 * Editor-specific configuration format
 */
export interface EditorSpecificConfig {
  /** Target editor */
  editor: MCPEditorType;
  
  /** Generated configuration */
  config: Record<string, any>;
  
  /** Configuration file path */
  filePath: string;
  
  /** Generation timestamp */
  generatedAt: Date;
  
  /** Source configuration version */
  sourceVersion: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Deep partial type for configuration updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Configuration update type
 */
export type MCPConfigUpdate = DeepPartial<TekUpMCPConfig>;

/**
 * Server configuration update type
 */
export type MCPServerUpdate = DeepPartial<TekUpMCPServer>;

/**
 * Environment-specific configuration type
 */
export type MCPEnvironmentConfig = Pick<TekUpMCPConfig, 'mcpServers' | 'global'>;

/**
 * Configuration validation modes
 */
export type MCPValidationMode = 'strict' | 'lenient' | 'disabled';

/**
 * Configuration merge strategies
 */
export type MCPMergeStrategy = 'deep' | 'shallow' | 'replace';

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is a valid MCP environment
 */
export function isValidMCPEnvironment(value: any): value is MCPEnvironment {
  return typeof value === 'string' && 
    ['development', 'staging', 'production'].includes(value);
}

/**
 * Type guard to check if a value is a valid MCP server type
 */
export function isValidMCPServerType(value: any): value is MCPServerType {
  return typeof value === 'string' && 
    ['browser', 'filesystem', 'search', 'automation', 'billing', 'custom'].includes(value);
}

/**
 * Type guard to check if a value is a valid editor type
 */
export function isValidEditorType(value: any): value is MCPEditorType {
  return typeof value === 'string' && 
    ['windsurf', 'kiro', 'vscode', 'trae', 'cursor'].includes(value);
}

/**
 * Type guard to check if a configuration is valid
 */
export function isValidMCPConfig(value: any): value is TekUpMCPConfig {
  return typeof value === 'object' && 
    value !== null &&
    typeof value.version === 'string' &&
    typeof value.name === 'string' &&
    typeof value.mcpServers === 'object' &&
    typeof value.global === 'object';
}

// =============================================================================
// HELPER TYPES FOR SPECIFIC USE CASES
// =============================================================================

/**
 * Browser server specific configuration
 */
export type BrowserServerConfig = Extract<TekUpMCPServer, { id: string }> & {
  type: 'browser';
};

/**
 * Filesystem server specific configuration  
 */
export type FilesystemServerConfig = Extract<TekUpMCPServer, { id: string }> & {
  type: 'filesystem';
};

/**
 * Search server specific configuration
 */
export type SearchServerConfig = Extract<TekUpMCPServer, { id: string }> & {
  type: 'search';
};

/**
 * Automation server specific configuration
 */
export type AutomationServerConfig = Extract<TekUpMCPServer, { id: string }> & {
  type: 'automation';
};

/**
 * Configuration builder pattern types
 */
export interface MCPConfigBuilder {
  /** Set environment */
  environment(env: MCPEnvironment): MCPConfigBuilder;
  
  /** Add server */
  server(id: string, server: TekUpMCPServer): MCPConfigBuilder;
  
  /** Remove server */
  removeServer(id: string): MCPConfigBuilder;
  
  /** Update global settings */
  global(settings: DeepPartial<TekUpMCPConfig['global']>): MCPConfigBuilder;
  
  /** Build final configuration */
  build(): TekUpMCPConfig;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * MCP configuration error types
 */
export type MCPConfigErrorType = 
  | 'INVALID_ENVIRONMENT'
  | 'MISSING_CONFIG_FILE'
  | 'INVALID_JSON'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'SERVER_NOT_FOUND'
  | 'DUPLICATE_SERVER_ID'
  | 'CIRCULAR_DEPENDENCY'
  | 'ENVIRONMENT_VARIABLE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'ADAPTER_NOT_FOUND'
  | 'MERGE_CONFLICT';

/**
 * Specific MCP configuration error
 */
export class MCPConfigError extends Error {
  constructor(
    public readonly type: MCPConfigErrorType,
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'MCPConfigError';
  }
}

// =============================================================================
// CONSTANTS FOR VALIDATION
// =============================================================================

/**
 * JSON Schema reference URLs
 */
export const MCP_SCHEMA_URLS = {
  /** Main configuration schema */
  MAIN: 'https://tekup.org/schemas/mcp-config.schema.json',
  
  /** Server schema */
  SERVER: 'https://tekup.org/schemas/mcp-server.schema.json',
  
  /** Environment schema */
  ENVIRONMENT: 'https://tekup.org/schemas/mcp-environment.schema.json'
} as const;

/**
 * Default configuration templates
 */
export const MCP_DEFAULT_CONFIGS = {
  /** Minimal base configuration */
  MINIMAL: {
    version: '1.0.0',
    name: 'TekUp MCP Configuration',
    mcpServers: {},
    global: {
      logging: { level: 'info' as const },
      security: { 
        allowUnsignedPlugins: false,
        trustedAuthors: [],
        blockedPlugins: [],
        sandboxMode: false
      },
      performance: {
        maxConcurrentServers: 5,
        defaultTimeout: 30000
      },
      monitoring: {
        healthChecks: true,
        metricsCollection: true,
        errorReporting: true,
        performanceTracking: true
      }
    },
    environments: {
      supported: ['development', 'staging', 'production'] as MCPEnvironment[],
      default: 'development' as MCPEnvironment,
      overrides: {}
    },
    editors: {
      supported: ['windsurf', 'kiro', 'vscode', 'trae', 'cursor'] as MCPEditorType[],
      adapters: {}
    }
  }
} as const;
