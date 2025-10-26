/**
 * @fileoverview JSON Schema validation utilities for TekUp MCP configuration
 * 
 * This module provides TypeScript integration with JSON Schema validation,
 * including compile-time type checking and runtime validation utilities.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { 
  TekUpMCPConfig,
  MCPConfigValidationResult,
  MCPValidationError,
  MCPValidationWarning,
  MCPConfigLoadingError
} from '@tekup/shared/mcp/configuration';

// =============================================================================
// JSON SCHEMA DEFINITIONS
// =============================================================================

/**
 * JSON Schema type definition for MCP configuration
 * This matches the structure defined in mcp-config.schema.json
 */
export interface MCPConfigJsonSchema {
  $schema: string;
  $id: string;
  title: string;
  description: string;
  type: 'object';
  properties: {
    $schema?: { type: 'string'; format: 'uri' };
    version: { type: 'string'; pattern: string };
    name: { type: 'string'; minLength: number };
    description?: { type: 'string' };
    extends?: { type: 'string'; description: string };
    environment?: { type: 'string'; enum: string[] };
    metadata?: MCPMetadataSchema;
    mcpServers: MCPServersSchema;
    global?: MCPGlobalSchema;
    environments?: MCPEnvironmentsSchema;
    editors?: MCPEditorsSchema;
  };
  required: string[];
  additionalProperties: boolean;
  definitions: MCPSchemaDefinitions;
}

/**
 * Schema definitions for nested objects
 */
export interface MCPSchemaDefinitions {
  mcpServer: MCPServerSchema;
  transport: MCPTransportSchema;
  capabilities: MCPCapabilitiesSchema;
  tool: MCPToolSchema;
  resource: MCPResourceSchema;
  prompt: MCPPromptSchema;
  promptArgument: MCPPromptArgumentSchema;
  serverConfig: MCPServerConfigSchema;
  logging: MCPLoggingSchema;
  security: MCPSecuritySchema;
  performance: MCPPerformanceSchema;
  monitoring: MCPMonitoringSchema;
  editorAdapter: MCPEditorAdapterSchema;
}

/**
 * Individual schema interfaces
 */
export interface MCPMetadataSchema {
  type: 'object';
  properties: {
    created: { type: 'string'; format: 'date-time' };
    lastModified: { type: 'string'; format: 'date-time' };
    author: { type: 'string' };
    repository?: { type: 'string'; format: 'uri' };
  };
  additionalProperties: boolean;
}

export interface MCPServersSchema {
  type: 'object';
  patternProperties: {
    [pattern: string]: { $ref: string };
  };
  additionalProperties: boolean;
}

export interface MCPServerSchema {
  type: 'object';
  properties: {
    id?: { type: 'string' };
    name?: { type: 'string' };
    description?: { type: 'string' };
    version?: { type: 'string' };
    enabled?: { type: 'boolean'; default: boolean };
    priority?: { type: 'integer'; minimum: number };
    transport: { $ref: string };
    capabilities?: { $ref: string };
    config?: { $ref: string };
  };
  required: string[];
  additionalProperties: boolean;
}

export interface MCPTransportSchema {
  type: 'object';
  properties: {
    type: { type: 'string'; enum: string[] };
    config: MCPTransportConfigSchema;
  };
  required: string[];
  additionalProperties: boolean;
}

export interface MCPTransportConfigSchema {
  type: 'object';
  properties: {
    command?: { type: 'string' };
    args?: { type: 'array'; items: { type: 'string' } };
    env?: { type: 'object'; additionalProperties: { type: 'string' } };
    url?: { type: 'string'; format: 'uri' };
    headers?: { type: 'object'; additionalProperties: { type: 'string' } };
    timeout?: { type: 'integer'; minimum: number };
    retryAttempts?: { type: 'integer'; minimum: number };
    retryDelay?: { type: 'integer'; minimum: number };
  };
  additionalProperties: boolean;
}

export interface MCPCapabilitiesSchema {
  type: 'object';
  properties: {
    tools?: { type: 'array'; items: { $ref: string } };
    resources?: { type: 'array'; items: { $ref: string } };
    prompts?: { type: 'array'; items: { $ref: string } };
    sampling?: { type: 'boolean' };
    logging?: { type: 'array'; items: { type: 'string'; enum: string[] } };
  };
  additionalProperties: boolean;
}

export interface MCPToolSchema {
  type: 'object';
  properties: {
    name: { type: 'string' };
    description?: { type: 'string' };
    inputSchema?: { type: 'object' };
    outputSchema?: { type: 'object' };
  };
  required: string[];
  additionalProperties: boolean;
}

export interface MCPResourceSchema {
  type: 'object';
  properties: {
    uri: { type: 'string' };
    name?: { type: 'string' };
    description?: { type: 'string' };
    mimeType?: { type: 'string' };
  };
  required: string[];
  additionalProperties: boolean;
}

export interface MCPPromptSchema {
  type: 'object';
  properties: {
    name: { type: 'string' };
    description?: { type: 'string' };
    arguments?: { type: 'array'; items: { $ref: string } };
  };
  required: string[];
  additionalProperties: boolean;
}

export interface MCPPromptArgumentSchema {
  type: 'object';
  properties: {
    name: { type: 'string' };
    description?: { type: 'string' };
    required?: { type: 'boolean' };
    type: { type: 'string'; enum: string[] };
  };
  required: string[];
  additionalProperties: boolean;
}

export interface MCPServerConfigSchema {
  type: 'object';
  properties: {
    autoStart?: { type: 'boolean' };
    retryAttempts?: { type: 'integer'; minimum: number };
    retryDelay?: { type: 'integer'; minimum: number };
    healthCheckInterval?: { type: 'integer'; minimum: number };
    requestTimeout?: { type: 'integer'; minimum: number };
    maxConcurrentRequests?: { type: 'integer'; minimum: number };
  };
  additionalProperties: boolean;
}

export interface MCPGlobalSchema {
  type: 'object';
  properties: {
    logging?: { $ref: string };
    security?: { $ref: string };
    performance?: { $ref: string };
    monitoring?: { $ref: string };
  };
  additionalProperties: boolean;
}

export interface MCPLoggingSchema {
  type: 'object';
  properties: {
    level?: { type: 'string'; enum: string[] };
    file?: { type: 'string' };
    maxSize?: { type: 'string' };
    maxFiles?: { type: 'integer'; minimum: number };
    timestamp?: { type: 'boolean' };
    json?: { type: 'boolean' };
    console?: { type: 'boolean' };
    structured?: { type: 'boolean' };
    rotation?: { type: 'string'; enum: string[] };
  };
  additionalProperties: boolean;
}

export interface MCPSecuritySchema {
  type: 'object';
  properties: {
    allowUnsignedPlugins?: { type: 'boolean' };
    trustedAuthors?: { type: 'array'; items: { type: 'string' } };
    blockedPlugins?: { type: 'array'; items: { type: 'string' } };
    sandboxMode?: { type: 'boolean' };
    requireHttps?: { type: 'boolean' };
    encryptionRequired?: { type: 'boolean' };
    auditLogging?: { type: 'boolean' };
    rateLimiting?: MCPRateLimitingSchema;
  };
  additionalProperties: boolean;
}

export interface MCPRateLimitingSchema {
  type: 'object';
  properties: {
    enabled: { type: 'boolean' };
    maxRequestsPerMinute?: { type: 'integer'; minimum: number };
    maxRequestsPerHour?: { type: 'integer'; minimum: number };
  };
  additionalProperties: boolean;
}

export interface MCPPerformanceSchema {
  type: 'object';
  properties: {
    maxConcurrentServers?: { type: 'integer'; minimum: number };
    defaultTimeout?: { type: 'integer'; minimum: number };
    connectionPoolSize?: { type: 'integer'; minimum: number };
    requestQueueLimit?: { type: 'integer'; minimum: number };
    memoryLimit?: { type: 'string' };
    cpuLimit?: { type: 'string' };
  };
  additionalProperties: boolean;
}

export interface MCPMonitoringSchema {
  type: 'object';
  properties: {
    healthChecks?: { type: 'boolean' };
    metricsCollection?: { type: 'boolean' };
    errorReporting?: { type: 'boolean' };
    performanceTracking?: { type: 'boolean' };
    debugMode?: { type: 'boolean' };
    testMode?: { type: 'boolean' };
    alerting?: MCPAlertingSchema;
  };
  additionalProperties: boolean;
}

export interface MCPAlertingSchema {
  type: 'object';
  properties: {
    enabled?: { type: 'boolean' };
    errorThreshold?: { type: 'integer'; minimum: number };
    responseTimeThreshold?: { type: 'integer'; minimum: number };
    notificationChannels?: { 
      type: 'array'; 
      items: { type: 'string'; enum: string[] }; 
    };
  };
  additionalProperties: boolean;
}

export interface MCPEnvironmentsSchema {
  type: 'object';
  properties: {
    supported?: { type: 'array'; items: { type: 'string' } };
    default?: { type: 'string' };
    overrides?: { 
      type: 'object';
      additionalProperties: {
        type: 'object';
        properties: {
          file?: { type: 'string' };
          description?: { type: 'string' };
        };
      };
    };
  };
}

export interface MCPEditorsSchema {
  type: 'object';
  properties: {
    supported?: { type: 'array'; items: { type: 'string' } };
    adapters?: { 
      type: 'object';
      additionalProperties: { $ref: string };
    };
  };
}

export interface MCPEditorAdapterSchema {
  type: 'object';
  properties: {
    format: { type: 'string' };
    adapter: { type: 'string' };
    configPath: { type: 'string' };
  };
  required: string[];
  additionalProperties: boolean;
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Strict mode validation */
  strict?: boolean;
  
  /** Allow additional properties */
  allowAdditional?: boolean;
  
  /** Schema version to validate against */
  schemaVersion?: string;
  
  /** Custom error formatter */
  errorFormatter?: (error: any) => MCPValidationError;
  
  /** Custom warning detector */
  warningDetector?: (config: any) => MCPValidationWarning[];
}

/**
 * Schema validation result with detailed information
 */
export interface SchemaValidationResult extends MCPConfigValidationResult {
  /** Schema version used for validation */
  schemaVersion: string;
  
  /** Validation performance metrics */
  performance: {
    /** Validation time in milliseconds */
    duration: number;
    
    /** Memory usage during validation */
    memoryUsage?: number;
  };
  
  /** Schema-specific metadata */
  schemaMetadata?: {
    /** Schema file path */
    schemaPath: string;
    
    /** Schema last modified timestamp */
    schemaModified: string;
    
    /** Schema checksum */
    schemaChecksum?: string;
  };
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Schema validation error types
 */
export type SchemaValidationErrorType = 
  | 'SCHEMA_NOT_FOUND'
  | 'INVALID_SCHEMA_FORMAT'
  | 'PROPERTY_REQUIRED'
  | 'PROPERTY_TYPE_MISMATCH'
  | 'PROPERTY_FORMAT_INVALID'
  | 'PROPERTY_OUT_OF_RANGE'
  | 'PROPERTY_PATTERN_MISMATCH'
  | 'ADDITIONAL_PROPERTY_NOT_ALLOWED'
  | 'ENUM_VALUE_INVALID'
  | 'ARRAY_ITEM_INVALID'
  | 'OBJECT_PROPERTY_INVALID'
  | 'REFERENCE_RESOLUTION_FAILED';

/**
 * Enhanced validation error with schema context
 */
export interface SchemaValidationError extends MCPValidationError {
  /** Schema validation error type */
  errorType: SchemaValidationErrorType;
  
  /** JSON Schema keyword that failed */
  keyword?: string;
  
  /** Schema path that failed */
  schemaPath?: string;
  
  /** Data path that failed */
  dataPath?: string;
  
  /** Additional error parameters */
  params?: Record<string, any>;
}

/**
 * Schema-specific configuration loading error
 */
export class SchemaValidationLoadingError extends MCPConfigLoadingError {
  constructor(
    message: string,
    public readonly schemaErrors: SchemaValidationError[],
    configPath?: string
  ) {
    super(message);
    this.type = 'ValidationError';
    this.name = 'SchemaValidationLoadingError';
    this.configPath = configPath;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert JSON Schema validation errors to our format
 */
export function convertSchemaErrors(schemaErrors: any[]): SchemaValidationError[] {
  return schemaErrors.map(error => ({
    path: error.instancePath || error.dataPath || '',
    message: error.message || 'Unknown validation error',
    code: error.keyword || 'UNKNOWN',
    errorType: mapErrorTypeFromKeyword(error.keyword),
    keyword: error.keyword,
    schemaPath: error.schemaPath,
    dataPath: error.instancePath || error.dataPath,
    expected: error.schema,
    actual: error.data,
    params: error.params
  }));
}

/**
 * Map JSON Schema keywords to our error types
 */
function mapErrorTypeFromKeyword(keyword: string): SchemaValidationErrorType {
  const keywordMap: Record<string, SchemaValidationErrorType> = {
    'required': 'PROPERTY_REQUIRED',
    'type': 'PROPERTY_TYPE_MISMATCH',
    'format': 'PROPERTY_FORMAT_INVALID',
    'minimum': 'PROPERTY_OUT_OF_RANGE',
    'maximum': 'PROPERTY_OUT_OF_RANGE',
    'pattern': 'PROPERTY_PATTERN_MISMATCH',
    'additionalProperties': 'ADDITIONAL_PROPERTY_NOT_ALLOWED',
    'enum': 'ENUM_VALUE_INVALID',
    'items': 'ARRAY_ITEM_INVALID',
    'properties': 'OBJECT_PROPERTY_INVALID',
    '$ref': 'REFERENCE_RESOLUTION_FAILED'
  };
  
  return keywordMap[keyword] || 'PROPERTY_TYPE_MISMATCH';
}

/**
 * Generate warning for deprecated or problematic configurations
 */
export function generateConfigWarnings(config: TekUpMCPConfig): MCPValidationWarning[] {
  const warnings: MCPValidationWarning[] = [];
  
  // Check for deprecated configurations
  if (config.global?.security?.allowUnsignedPlugins) {
    warnings.push({
      path: 'global.security.allowUnsignedPlugins',
      message: 'Allowing unsigned plugins may pose security risks',
      code: 'SECURITY_WARNING',
      suggestion: 'Consider using trusted authors list instead'
    });
  }
  
  // Check for insecure settings in production
  if (config.environment === 'production') {
    if (config.global?.logging?.level === 'debug') {
      warnings.push({
        path: 'global.logging.level',
        message: 'Debug logging in production may impact performance and leak sensitive information',
        code: 'PRODUCTION_DEBUG_WARNING',
        suggestion: 'Use "error" or "warning" level for production'
      });
    }
    
    if (!config.global?.security?.sandboxMode) {
      warnings.push({
        path: 'global.security.sandboxMode',
        message: 'Sandbox mode is recommended for production environments',
        code: 'PRODUCTION_SECURITY_WARNING',
        suggestion: 'Enable sandbox mode for better security'
      });
    }
  }
  
  // Check for performance issues
  Object.entries(config.mcpServers).forEach(([serverId, server]) => {
    if (server.config?.requestTimeout && server.config.requestTimeout > 120000) {
      warnings.push({
        path: `mcpServers.${serverId}.config.requestTimeout`,
        message: 'Request timeout is very high and may cause poor user experience',
        code: 'PERFORMANCE_WARNING',
        suggestion: 'Consider reducing timeout to under 2 minutes'
      });
    }
  });
  
  return warnings;
}

/**
 * Validate configuration against multiple schema versions
 */
export function validateAgainstMultipleSchemas(
  config: TekUpMCPConfig,
  schemaVersions: string[]
): Record<string, SchemaValidationResult> {
  const results: Record<string, SchemaValidationResult> = {};
  
  for (const version of schemaVersions) {
    // This would integrate with actual JSON Schema validation library
    // For now, we'll create a placeholder result
    results[version] = {
      valid: true,
      errors: [],
      warnings: generateConfigWarnings(config),
      config,
      schemaVersion: version,
      performance: {
        duration: 0
      }
    };
  }
  
  return results;
}

/**
 * Check if configuration is compatible with a specific schema version
 */
export function isConfigurationCompatible(
  config: TekUpMCPConfig,
  targetSchemaVersion: string
): boolean {
  // Implementation would check compatibility rules
  // For now, assume compatibility based on version ranges
  const configVersion = config.version;
  
  // Simple semantic version comparison (would use proper semver library in practice)
  const [configMajor] = configVersion.split('.').map(Number);
  const [targetMajor] = targetSchemaVersion.split('.').map(Number);
  
  return configMajor === targetMajor;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  strict: true,
  allowAdditional: false,
  schemaVersion: '1.0.0'
};

/**
 * Schema validation performance thresholds
 */
export const VALIDATION_PERFORMANCE_THRESHOLDS = {
  /** Maximum acceptable validation time in milliseconds */
  MAX_VALIDATION_TIME: 5000,
  
  /** Maximum acceptable memory usage in MB */
  MAX_MEMORY_USAGE: 50,
  
  /** Warning threshold for validation time */
  WARNING_VALIDATION_TIME: 1000
} as const;
