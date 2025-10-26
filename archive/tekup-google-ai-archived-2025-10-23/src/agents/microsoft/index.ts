/**
 * Microsoft Agent Framework Integration for Renos
 * 
 * This module provides a complete integration with Microsoft Agent Framework
 * while maintaining backward compatibility with the existing Renos system.
 * 
 * Features:
 * - Thread-based state management
 * - Multi-agent orchestration
 * - Enterprise telemetry and monitoring
 * - Plugin system for extensibility
 * - Hybrid controller for gradual migration
 */

// Core components
export { RenosThreadManager, getThreadManager } from "./threadManager";
export { RenosAgentOrchestrator, getAgentOrchestrator } from "./agentOrchestrator";
export { RenosTelemetryService, getTelemetryService } from "./telemetryService";
export { RenosPluginManager, getPluginManager } from "./pluginManager";
export { RenosHybridController, getHybridController } from "./hybridController";

// Types
export type {
    RenosThread,
    BusinessContext,
    CustomerProfile,
    PricingEstimate,
    BookingRecord,
    ConversationState,
    AgentAction,
} from "./threadManager";

export type {
    AgentOrchestrationResult,
    AgentConfig,
} from "./agentOrchestrator";

export type {
    TelemetryMetrics,
    AgentPerformanceMetrics,
    SatisfactionMetrics,
    BusinessMetrics,
    ErrorAnalytics,
    ComplianceLog,
    SystemHealthMetrics,
} from "./telemetryService";

export type {
    RenosPlugin,
    PluginContext,
    PluginResult,
    PluginConfig,
} from "./pluginManager";

export type {
    HybridConfig,
    HybridProcessingResult,
} from "./hybridController";

/**
 * Initialize Microsoft Agent Framework integration
 * 
 * This function sets up all Microsoft components and should be called
 * during application startup.
 */
export async function initializeMicrosoftAgentFramework(config?: {
    enableOrchestration?: boolean;
    enableThreadManagement?: boolean;
    enableTelemetry?: boolean;
    enablePluginSystem?: boolean;
    debugMode?: boolean;
}): Promise<{
    success: boolean;
    components: {
        threadManager: boolean;
        orchestrator: boolean;
        telemetry: boolean;
        pluginManager: boolean;
        hybridController: boolean;
    };
    errors: string[];
}> {
    const errors: string[] = [];
    const components = {
        threadManager: false,
        orchestrator: false,
        telemetry: false,
        pluginManager: false,
        hybridController: false,
    };

    try {
        // Initialize thread manager
        try {
            const { getThreadManager } = await import("./threadManager");
            getThreadManager();
            components.threadManager = true;
        } catch (error) {
            errors.push(`Thread manager initialization failed: ${(error as Error).message}`);
        }

        // Initialize orchestrator
        try {
            const { getAgentOrchestrator } = await import("./agentOrchestrator");
            getAgentOrchestrator();
            components.orchestrator = true;
        } catch (error) {
            errors.push(`Agent orchestrator initialization failed: ${(error as Error).message}`);
        }

        // Initialize telemetry service
        try {
            const { getTelemetryService } = await import("./telemetryService");
            getTelemetryService();
            components.telemetry = true;
        } catch (error) {
            errors.push(`Telemetry service initialization failed: ${(error as Error).message}`);
        }

        // Initialize plugin manager
        try {
            const { getPluginManager } = await import("./pluginManager");
            getPluginManager();
            components.pluginManager = true;
        } catch (error) {
            errors.push(`Plugin manager initialization failed: ${(error as Error).message}`);
        }

        // Initialize hybrid controller
        try {
            const { getHybridController } = await import("./hybridController");
            getHybridController({
                enableMicrosoftOrchestration: config?.enableOrchestration ?? false,
                enableThreadManagement: config?.enableThreadManagement ?? false,
                enableTelemetry: config?.enableTelemetry ?? false,
                enablePluginSystem: config?.enablePluginSystem ?? false,
                debugMode: config?.debugMode ?? false,
            });
            components.hybridController = true;
        } catch (error) {
            errors.push(`Hybrid controller initialization failed: ${(error as Error).message}`);
        }

        const success = errors.length === 0;

        return {
            success,
            components,
            errors,
        };

    } catch (error) {
        errors.push(`Microsoft Agent Framework initialization failed: ${(error as Error).message}`);
        return {
            success: false,
            components,
            errors,
        };
    }
}

/**
 * Get Microsoft Agent Framework status
 * 
 * Returns the current status of all Microsoft components
 */
export async function getMicrosoftAgentFrameworkStatus(): Promise<{
    initialized: boolean;
    components: {
        threadManager: boolean;
        orchestrator: boolean;
        telemetry: boolean;
        pluginManager: boolean;
        hybridController: boolean;
    };
    configuration: {
        enableOrchestration: boolean;
        enableThreadManagement: boolean;
        enableTelemetry: boolean;
        enablePluginSystem: boolean;
        debugMode: boolean;
    };
}> {
    try {
        const { getHybridController } = await import("./hybridController");
        const hybridController = getHybridController();
        const config = hybridController.getConfig();

        return {
            initialized: true,
            components: {
                threadManager: true,
                orchestrator: true,
                telemetry: true,
                pluginManager: true,
                hybridController: true,
            },
            configuration: {
                enableOrchestration: config.enableMicrosoftOrchestration,
                enableThreadManagement: config.enableThreadManagement,
                enableTelemetry: config.enableTelemetry,
                enablePluginSystem: config.enablePluginSystem,
                debugMode: config.debugMode,
            },
        };
    } catch (error) {
        return {
            initialized: false,
            components: {
                threadManager: false,
                orchestrator: false,
                telemetry: false,
                pluginManager: false,
                hybridController: false,
            },
            configuration: {
                enableOrchestration: false,
                enableThreadManagement: false,
                enableTelemetry: false,
                enablePluginSystem: false,
                debugMode: false,
            },
        };
    }
}

/**
 * Create a Microsoft Agent Framework plugin
 * 
 * Helper function to create plugins that integrate with the Microsoft system
 */
export function createMicrosoftPlugin(
    name: string,
    version: string,
    description: string,
    author: string,
    agentTypes: string[],
    execute: (context: PluginContext) => Promise<PluginResult>,
    options?: {
        dependencies?: string[];
        initialize?: () => Promise<void>;
        cleanup?: () => Promise<void>;
        validate?: (input: unknown) => boolean;
    }
): RenosPlugin {
    return {
        name,
        version,
        description,
        author,
        dependencies: options?.dependencies || [],
        agentTypes,
        initialize: options?.initialize || (async () => {}),
        execute,
        cleanup: options?.cleanup,
        validate: options?.validate,
    };
}

// Re-export types for convenience
import type { RenosPlugin, PluginContext, PluginResult } from "./pluginManager";