/**
 * Microsoft Agent Framework Configuration
 * 
 * Environment variables and settings for Microsoft Agent Framework integration
 */

export interface MicrosoftAgentConfig {
    // Feature flags
    enableOrchestration: boolean;
    enableThreadManagement: boolean;
    enableTelemetry: boolean;
    enablePluginSystem: boolean;
    enableHybridMode: boolean;
    
    // Performance settings
    maxConcurrentAgents: number;
    agentTimeoutMs: number;
    retryAttempts: number;
    
    // Telemetry settings
    telemetryEnabled: boolean;
    telemetryRetentionDays: number;
    performanceTrackingEnabled: boolean;
    
    // Thread management
    threadRetentionDays: number;
    maxThreadsPerCustomer: number;
    
    // Plugin system
    pluginTimeoutMs: number;
    pluginRetryAttempts: number;
    allowCustomPlugins: boolean;
    
    // Debug settings
    debugMode: boolean;
    verboseLogging: boolean;
    enableMetrics: boolean;
}

/**
 * Get Microsoft Agent Framework configuration from environment variables
 */
export function getMicrosoftAgentConfig(): MicrosoftAgentConfig {
    return {
        // Feature flags
        enableOrchestration: process.env.ENABLE_MICROSOFT_ORCHESTRATION === 'true',
        enableThreadManagement: process.env.ENABLE_MICROSOFT_THREADS === 'true',
        enableTelemetry: process.env.ENABLE_MICROSOFT_TELEMETRY === 'true',
        enablePluginSystem: process.env.ENABLE_MICROSOFT_PLUGINS === 'true',
        enableHybridMode: process.env.ENABLE_MICROSOFT_HYBRID === 'true',
        
        // Performance settings
        maxConcurrentAgents: parseInt(process.env.MICROSOFT_MAX_CONCURRENT_AGENTS || '5'),
        agentTimeoutMs: parseInt(process.env.MICROSOFT_AGENT_TIMEOUT_MS || '30000'),
        retryAttempts: parseInt(process.env.MICROSOFT_RETRY_ATTEMPTS || '2'),
        
        // Telemetry settings
        telemetryEnabled: process.env.MICROSOFT_TELEMETRY_ENABLED !== 'false',
        telemetryRetentionDays: parseInt(process.env.MICROSOFT_TELEMETRY_RETENTION_DAYS || '30'),
        performanceTrackingEnabled: process.env.MICROSOFT_PERFORMANCE_TRACKING !== 'false',
        
        // Thread management
        threadRetentionDays: parseInt(process.env.MICROSOFT_THREAD_RETENTION_DAYS || '90'),
        maxThreadsPerCustomer: parseInt(process.env.MICROSOFT_MAX_THREADS_PER_CUSTOMER || '10'),
        
        // Plugin system
        pluginTimeoutMs: parseInt(process.env.MICROSOFT_PLUGIN_TIMEOUT_MS || '30000'),
        pluginRetryAttempts: parseInt(process.env.MICROSOFT_PLUGIN_RETRY_ATTEMPTS || '2'),
        allowCustomPlugins: process.env.MICROSOFT_ALLOW_CUSTOM_PLUGINS !== 'false',
        
        // Debug settings
        debugMode: process.env.NODE_ENV === 'development' || process.env.MICROSOFT_DEBUG === 'true',
        verboseLogging: process.env.MICROSOFT_VERBOSE_LOGGING === 'true',
        enableMetrics: process.env.MICROSOFT_ENABLE_METRICS !== 'false',
    };
}

/**
 * Default configuration for Microsoft Agent Framework
 */
export const DEFAULT_MICROSOFT_AGENT_CONFIG: MicrosoftAgentConfig = {
    enableOrchestration: false,
    enableThreadManagement: false,
    enableTelemetry: false,
    enablePluginSystem: false,
    enableHybridMode: true,
    
    maxConcurrentAgents: 5,
    agentTimeoutMs: 30000,
    retryAttempts: 2,
    
    telemetryEnabled: true,
    telemetryRetentionDays: 30,
    performanceTrackingEnabled: true,
    
    threadRetentionDays: 90,
    maxThreadsPerCustomer: 10,
    
    pluginTimeoutMs: 30000,
    pluginRetryAttempts: 2,
    allowCustomPlugins: true,
    
    debugMode: false,
    verboseLogging: false,
    enableMetrics: true,
};

/**
 * Validate Microsoft Agent Framework configuration
 */
export function validateMicrosoftAgentConfig(config: MicrosoftAgentConfig): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    
    // Validate numeric values
    if (config.maxConcurrentAgents < 1 || config.maxConcurrentAgents > 20) {
        errors.push("maxConcurrentAgents must be between 1 and 20");
    }
    
    if (config.agentTimeoutMs < 1000 || config.agentTimeoutMs > 300000) {
        errors.push("agentTimeoutMs must be between 1000 and 300000");
    }
    
    if (config.retryAttempts < 0 || config.retryAttempts > 5) {
        errors.push("retryAttempts must be between 0 and 5");
    }
    
    if (config.telemetryRetentionDays < 1 || config.telemetryRetentionDays > 365) {
        errors.push("telemetryRetentionDays must be between 1 and 365");
    }
    
    if (config.threadRetentionDays < 1 || config.threadRetentionDays > 365) {
        errors.push("threadRetentionDays must be between 1 and 365");
    }
    
    if (config.maxThreadsPerCustomer < 1 || config.maxThreadsPerCustomer > 100) {
        errors.push("maxThreadsPerCustomer must be between 1 and 100");
    }
    
    if (config.pluginTimeoutMs < 1000 || config.pluginTimeoutMs > 300000) {
        errors.push("pluginTimeoutMs must be between 1000 and 300000");
    }
    
    if (config.pluginRetryAttempts < 0 || config.pluginRetryAttempts > 5) {
        errors.push("pluginRetryAttempts must be between 0 and 5");
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get Microsoft Agent Framework environment variables documentation
 */
export function getMicrosoftAgentEnvVars(): Record<string, {
    description: string;
    type: string;
    default: string;
    required: boolean;
}> {
    return {
        ENABLE_MICROSOFT_ORCHESTRATION: {
            description: "Enable Microsoft Agent Framework orchestration",
            type: "boolean",
            default: "false",
            required: false,
        },
        ENABLE_MICROSOFT_THREADS: {
            description: "Enable Microsoft thread-based state management",
            type: "boolean",
            default: "false",
            required: false,
        },
        ENABLE_MICROSOFT_TELEMETRY: {
            description: "Enable Microsoft telemetry and monitoring",
            type: "boolean",
            default: "false",
            required: false,
        },
        ENABLE_MICROSOFT_PLUGINS: {
            description: "Enable Microsoft plugin system",
            type: "boolean",
            default: "false",
            required: false,
        },
        ENABLE_MICROSOFT_HYBRID: {
            description: "Enable hybrid mode (Microsoft + Legacy)",
            type: "boolean",
            default: "true",
            required: false,
        },
        MICROSOFT_MAX_CONCURRENT_AGENTS: {
            description: "Maximum number of concurrent agents",
            type: "number",
            default: "5",
            required: false,
        },
        MICROSOFT_AGENT_TIMEOUT_MS: {
            description: "Agent execution timeout in milliseconds",
            type: "number",
            default: "30000",
            required: false,
        },
        MICROSOFT_RETRY_ATTEMPTS: {
            description: "Number of retry attempts for failed agents",
            type: "number",
            default: "2",
            required: false,
        },
        MICROSOFT_TELEMETRY_ENABLED: {
            description: "Enable telemetry collection",
            type: "boolean",
            default: "true",
            required: false,
        },
        MICROSOFT_TELEMETRY_RETENTION_DAYS: {
            description: "Telemetry data retention period in days",
            type: "number",
            default: "30",
            required: false,
        },
        MICROSOFT_PERFORMANCE_TRACKING: {
            description: "Enable performance tracking",
            type: "boolean",
            default: "true",
            required: false,
        },
        MICROSOFT_THREAD_RETENTION_DAYS: {
            description: "Thread data retention period in days",
            type: "number",
            default: "90",
            required: false,
        },
        MICROSOFT_MAX_THREADS_PER_CUSTOMER: {
            description: "Maximum threads per customer",
            type: "number",
            default: "10",
            required: false,
        },
        MICROSOFT_PLUGIN_TIMEOUT_MS: {
            description: "Plugin execution timeout in milliseconds",
            type: "number",
            default: "30000",
            required: false,
        },
        MICROSOFT_PLUGIN_RETRY_ATTEMPTS: {
            description: "Number of retry attempts for failed plugins",
            type: "number",
            default: "2",
            required: false,
        },
        MICROSOFT_ALLOW_CUSTOM_PLUGINS: {
            description: "Allow custom plugin registration",
            type: "boolean",
            default: "true",
            required: false,
        },
        MICROSOFT_DEBUG: {
            description: "Enable debug mode",
            type: "boolean",
            default: "false",
            required: false,
        },
        MICROSOFT_VERBOSE_LOGGING: {
            description: "Enable verbose logging",
            type: "boolean",
            default: "false",
            required: false,
        },
        MICROSOFT_ENABLE_METRICS: {
            description: "Enable metrics collection",
            type: "boolean",
            default: "true",
            required: false,
        },
    };
}