/**
 * @fileoverview Centralized MCP Configuration Types for TekUp.org
 *
 * This module extends the base MCP interfaces to support centralized configuration
 * management with environment-specific overrides, editor integration, and enhanced
 * security features.
 *
 * @author TekUp.org Development Team
 * @version 1.0.0
 */
import { MCPServer, MCPTransport, MCPServerConfig, MCPLoggingLevel } from './index';
/**
 * Main configuration interface for the TekUp MCP system
 */
export interface TekUpMCPConfig {
    /** JSON Schema reference for validation */
    $schema?: string;
    /** Configuration version following semantic versioning */
    version: string;
    /** Human-readable configuration name */
    name: string;
    /** Configuration description */
    description?: string;
    /** Base configuration file to extend (for environment overrides) */
    extends?: string;
    /** Target environment for this configuration */
    environment?: MCPEnvironment;
    /** Configuration metadata */
    metadata?: MCPConfigMetadata;
    /** MCP servers configuration */
    mcpServers: Record<string, TekUpMCPServer>;
    /** Global configuration settings */
    global: TekUpMCPGlobalConfig;
    /** Environment configuration */
    environments: MCPEnvironmentConfig;
    /** Editor integration configuration */
    editors: MCPEditorConfig;
}
/**
 * Enhanced MCP Server interface with TekUp-specific extensions
 */
export interface TekUpMCPServer extends Omit<MCPServer, 'transport' | 'config'> {
    /** Server priority for startup ordering */
    priority?: number;
    /** Whether the server is enabled */
    enabled: boolean;
    /** Enhanced transport configuration */
    transport: TekUpMCPTransport;
    /** Enhanced server configuration */
    config: TekUpMCPServerConfig;
}
/**
 * Enhanced transport configuration with retry and environment variable support
 */
export interface TekUpMCPTransport extends MCPTransport {
    config: TekUpMCPTransportConfig;
}
/**
 * Enhanced transport configuration with additional features
 */
export interface TekUpMCPTransportConfig {
    /** Command to execute (for stdio transport) */
    command?: string;
    /** Command arguments with environment variable substitution support */
    args?: string[];
    /** Environment variables with substitution support */
    env?: Record<string, string>;
    /** URL for HTTP transport */
    url?: string;
    /** HTTP headers */
    headers?: Record<string, string>;
    /** Connection timeout in milliseconds */
    timeout?: number;
    /** Number of retry attempts */
    retryAttempts?: number;
    /** Delay between retries in milliseconds */
    retryDelay?: number;
    /** Working directory for the command */
    cwd?: string;
}
/**
 * Enhanced server configuration with additional monitoring and performance options
 */
export interface TekUpMCPServerConfig extends MCPServerConfig {
    /** Additional performance and monitoring options */
    /** Memory limit for the server process */
    memoryLimit?: string;
    /** CPU limit for the server process */
    cpuLimit?: string;
    /** Enable performance monitoring */
    performanceMonitoring?: boolean;
    /** Custom configuration properties */
    custom?: Record<string, any>;
}
/**
 * Supported MCP environments
 */
export type MCPEnvironment = 'development' | 'staging' | 'production';
/**
 * Configuration metadata
 */
export interface MCPConfigMetadata {
    /** Creation timestamp */
    created: string;
    /** Last modification timestamp */
    lastModified: string;
    /** Configuration author */
    author: string;
    /** Repository URL */
    repository?: string;
    /** Additional metadata */
    [key: string]: any;
}
/**
 * Environment configuration
 */
export interface MCPEnvironmentConfig {
    /** Supported environments */
    supported: MCPEnvironment[];
    /** Default environment */
    default: MCPEnvironment;
    /** Environment-specific override configurations */
    overrides: Record<MCPEnvironment, MCPEnvironmentOverride>;
}
/**
 * Environment-specific configuration override
 */
export interface MCPEnvironmentOverride {
    /** Override configuration file name */
    file: string;
    /** Override description */
    description: string;
    /** Environment-specific settings */
    settings?: Record<string, any>;
}
/**
 * Global MCP configuration settings
 */
export interface TekUpMCPGlobalConfig {
    /** Logging configuration */
    logging: MCPLoggingConfig;
    /** Security configuration */
    security: MCPSecurityConfig;
    /** Performance configuration */
    performance: MCPPerformanceConfig;
    /** Monitoring configuration */
    monitoring: MCPMonitoringConfig;
    /** Environment-specific global settings */
    [environment: string]: any;
}
/**
 * Logging configuration
 */
export interface MCPLoggingConfig {
    /** Logging level */
    level: MCPLoggingLevel;
    /** Log file path */
    file?: string;
    /** Maximum log file size */
    maxSize?: string;
    /** Maximum number of log files */
    maxFiles?: number;
    /** Include timestamps in logs */
    timestamp?: boolean;
    /** Use JSON format for logs */
    json?: boolean;
    /** Enable console logging */
    console?: boolean;
    /** Use structured logging */
    structured?: boolean;
    /** Log rotation strategy */
    rotation?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}
/**
 * Security configuration
 */
export interface MCPSecurityConfig {
    /** Allow unsigned plugins */
    allowUnsignedPlugins: boolean;
    /** List of trusted authors */
    trustedAuthors: string[];
    /** List of blocked plugins */
    blockedPlugins: string[];
    /** Enable sandbox mode */
    sandboxMode: boolean;
    /** Require HTTPS for remote connections */
    requireHttps?: boolean;
    /** Require encryption for sensitive data */
    encryptionRequired?: boolean;
    /** Enable audit logging */
    auditLogging?: boolean;
    /** Rate limiting configuration */
    rateLimiting?: MCPRateLimitingConfig;
}
/**
 * Rate limiting configuration
 */
export interface MCPRateLimitingConfig {
    /** Enable rate limiting */
    enabled: boolean;
    /** Maximum requests per minute */
    maxRequestsPerMinute?: number;
    /** Maximum requests per hour */
    maxRequestsPerHour?: number;
    /** Custom rate limiting rules */
    customRules?: MCPRateLimitRule[];
}
/**
 * Rate limiting rule
 */
export interface MCPRateLimitRule {
    /** Rule pattern or server ID */
    pattern: string;
    /** Maximum requests for this rule */
    maxRequests: number;
    /** Time window in seconds */
    windowSeconds: number;
}
/**
 * Performance configuration
 */
export interface MCPPerformanceConfig {
    /** Maximum concurrent servers */
    maxConcurrentServers: number;
    /** Default timeout for operations */
    defaultTimeout: number;
    /** Connection pool size */
    connectionPoolSize?: number;
    /** Request queue limit */
    requestQueueLimit?: number;
    /** Memory limit for the entire MCP system */
    memoryLimit?: string;
    /** CPU limit for the entire MCP system */
    cpuLimit?: string;
}
/**
 * Monitoring configuration
 */
export interface MCPMonitoringConfig {
    /** Enable health checks */
    healthChecks: boolean;
    /** Enable metrics collection */
    metricsCollection: boolean;
    /** Enable error reporting */
    errorReporting: boolean;
    /** Enable performance tracking */
    performanceTracking: boolean;
    /** Enable debug mode */
    debugMode?: boolean;
    /** Enable test mode */
    testMode?: boolean;
    /** Alerting configuration */
    alerting?: MCPAlertingConfig;
}
/**
 * Alerting configuration
 */
export interface MCPAlertingConfig {
    /** Enable alerting */
    enabled: boolean;
    /** Error threshold for alerts */
    errorThreshold?: number;
    /** Response time threshold for alerts */
    responseTimeThreshold?: number;
    /** Notification channels */
    notificationChannels?: MCPNotificationChannel[];
    /** Custom alert rules */
    customRules?: MCPAlertRule[];
}
/**
 * Notification channels
 */
export type MCPNotificationChannel = 'email' | 'slack' | 'discord' | 'webhook';
/**
 * Alert rule
 */
export interface MCPAlertRule {
    /** Rule name */
    name: string;
    /** Rule condition */
    condition: string;
    /** Threshold value */
    threshold: number;
    /** Notification channels for this rule */
    channels: MCPNotificationChannel[];
}
/**
 * Editor configuration
 */
export interface MCPEditorConfig {
    /** Supported editors */
    supported: MCPEditorType[];
    /** Editor-specific adapters */
    adapters: Record<MCPEditorType, MCPEditorAdapter>;
}
/**
 * Supported editor types
 */
export type MCPEditorType = 'windsurf' | 'kiro' | 'vscode' | 'trae' | 'cursor';
/**
 * Editor adapter configuration
 */
export interface MCPEditorAdapter {
    /** Configuration format for this editor */
    format: string;
    /** Adapter module path */
    adapter: string;
    /** Editor configuration file path */
    configPath: string;
    /** Editor-specific settings */
    settings?: Record<string, any>;
}
/**
 * Browser MCP server configuration
 */
export interface MCPBrowserServerConfig extends TekUpMCPServerConfig {
    /** Browser type to use */
    browserType?: 'chromium' | 'firefox' | 'webkit';
    /** Browser launch options */
    launchOptions?: MCPBrowserLaunchOptions;
    /** Page interaction settings */
    pageSettings?: MCPBrowserPageSettings;
}
/**
 * Browser launch options
 */
export interface MCPBrowserLaunchOptions {
    /** Run browser in headless mode */
    headless?: boolean;
    /** Browser executable path */
    executablePath?: string;
    /** Additional browser arguments */
    args?: string[];
    /** Viewport size */
    viewport?: {
        width: number;
        height: number;
    };
    /** User data directory */
    userDataDir?: string;
}
/**
 * Browser page settings
 */
export interface MCPBrowserPageSettings {
    /** Default navigation timeout */
    navigationTimeout?: number;
    /** Default wait timeout */
    waitTimeout?: number;
    /** Enable JavaScript */
    javaScriptEnabled?: boolean;
    /** User agent string */
    userAgent?: string;
    /** Default viewport */
    viewport?: {
        width: number;
        height: number;
        deviceScaleFactor?: number;
    };
}
/**
 * Filesystem MCP server configuration
 */
export interface MCPFilesystemServerConfig extends TekUpMCPServerConfig {
    /** Allowed root directories */
    rootDirectories: string[];
    /** File access permissions */
    permissions: MCPFilesystemPermissions;
    /** File watching configuration */
    watching?: MCPFilesystemWatchingConfig;
}
/**
 * Filesystem permissions
 */
export interface MCPFilesystemPermissions {
    /** Allow reading files */
    read: boolean;
    /** Allow writing files */
    write: boolean;
    /** Allow creating files/directories */
    create: boolean;
    /** Allow deleting files/directories */
    delete: boolean;
    /** Allow executing files */
    execute: boolean;
    /** File patterns to exclude */
    excludePatterns?: string[];
    /** File patterns to include only */
    includePatterns?: string[];
}
/**
 * Filesystem watching configuration
 */
export interface MCPFilesystemWatchingConfig {
    /** Enable file watching */
    enabled: boolean;
    /** Watch patterns */
    patterns?: string[];
    /** Ignore patterns */
    ignorePatterns?: string[];
    /** Watch options */
    options?: {
        /** Watch recursively */
        recursive?: boolean;
        /** Debounce delay in milliseconds */
        debounce?: number;
    };
}
/**
 * Configuration loading options
 */
export interface MCPConfigLoadOptions {
    /** Target environment */
    environment?: MCPEnvironment;
    /** Enable caching */
    cache?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
    /** Enable hot reload */
    hotReload?: boolean;
    /** Validation options */
    validation?: {
        /** Enable JSON schema validation */
        schema?: boolean;
        /** Enable environment variable validation */
        envVars?: boolean;
        /** Strict mode validation */
        strict?: boolean;
    };
}
/**
 * Configuration merge options
 */
export interface MCPConfigMergeOptions {
    /** Array merge strategy */
    arrayMerge?: 'replace' | 'concat' | 'merge';
    /** Deep merge objects */
    deepMerge?: boolean;
    /** Custom merge functions */
    customMergers?: Record<string, (target: any, source: any) => any>;
}
/**
 * Environment variable reference
 */
export interface MCPEnvironmentVariable {
    /** Variable name */
    name: string;
    /** Default value if variable is not set */
    default?: string;
    /** Whether the variable is required */
    required?: boolean;
    /** Variable type */
    type?: 'string' | 'number' | 'boolean' | 'json';
    /** Variable description */
    description?: string;
}
/**
 * Configuration validation result
 */
export interface MCPConfigValidationResult {
    /** Whether validation passed */
    valid: boolean;
    /** Validation errors */
    errors: MCPValidationError[];
    /** Validation warnings */
    warnings: MCPValidationWarning[];
    /** Validated configuration (if valid) */
    config?: TekUpMCPConfig;
}
/**
 * Validation error
 */
export interface MCPValidationError {
    /** Error path in configuration */
    path: string;
    /** Error message */
    message: string;
    /** Error code */
    code: string;
    /** Expected value or schema */
    expected?: any;
    /** Actual value */
    actual?: any;
}
/**
 * Validation warning
 */
export interface MCPValidationWarning {
    /** Warning path in configuration */
    path: string;
    /** Warning message */
    message: string;
    /** Warning code */
    code: string;
    /** Suggested fix */
    suggestion?: string;
}
/**
 * Configuration loading error
 */
export interface MCPConfigLoadingError extends Error {
    /** Error type */
    type: 'FileNotFound' | 'InvalidJSON' | 'ValidationError' | 'MergeError' | 'EnvironmentError';
    /** Configuration file path */
    configPath?: string;
    /** Environment that failed to load */
    environment?: MCPEnvironment;
    /** Detailed error information */
    details?: Record<string, any>;
}
//# sourceMappingURL=configuration.d.ts.map