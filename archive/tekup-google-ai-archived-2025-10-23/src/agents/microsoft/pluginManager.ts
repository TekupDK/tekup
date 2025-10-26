import { logger } from "../../logger";
import { getThreadManager, type RenosThread } from "./threadManager";
import { getTelemetryService } from "./telemetryService";

/**
 * Microsoft Agent Framework Plugin System
 * 
 * Enables type-safe plugin registration and management
 * Replaces simple handler system with enterprise plugin architecture
 */

export interface RenosPlugin {
    name: string;
    version: string;
    description: string;
    author: string;
    dependencies: string[];
    agentTypes: string[];
    initialize(): Promise<void>;
    execute(context: PluginContext): Promise<PluginResult>;
    cleanup?(): Promise<void>;
    validate?(input: unknown): boolean;
}

export interface PluginContext {
    thread: RenosThread;
    input: Record<string, unknown>;
    metadata: {
        userId?: string;
        sessionId?: string;
        timestamp: Date;
        requestId: string;
    };
}

export interface PluginResult {
    success: boolean;
    output: Record<string, unknown>;
    errors: string[];
    warnings: string[];
    executionTime: number;
    metadata?: Record<string, unknown>;
}

export interface PluginConfig {
    enabled: boolean;
    timeout: number;
    retryAttempts: number;
    priority: number;
    dependencies: string[];
}

/**
 * Plugin Manager for Microsoft Agent Framework
 */
export class RenosPluginManager {
    private plugins: Map<string, RenosPlugin> = new Map();
    private pluginConfigs: Map<string, PluginConfig> = new Map();
    private telemetryService = getTelemetryService();
    private threadManager = getThreadManager();

    /**
     * Register a plugin
     */
    async registerPlugin(plugin: RenosPlugin, config?: Partial<PluginConfig>): Promise<boolean> {
        try {
            // Validate plugin
            if (!this.validatePlugin(plugin)) {
                logger.error({ pluginName: plugin.name }, "Plugin validation failed");
                return false;
            }

            // Check dependencies
            const missingDeps = await this.checkDependencies(plugin.dependencies);
            if (missingDeps.length > 0) {
                logger.error({ 
                    pluginName: plugin.name, 
                    missingDependencies: missingDeps 
                }, "Plugin dependencies not satisfied");
                return false;
            }

            // Initialize plugin
            await plugin.initialize();

            // Register plugin
            this.plugins.set(plugin.name, plugin);
            
            // Set default config
            this.pluginConfigs.set(plugin.name, {
                enabled: config?.enabled ?? true,
                timeout: config?.timeout ?? 30000,
                retryAttempts: config?.retryAttempts ?? 2,
                priority: config?.priority ?? 0,
                dependencies: plugin.dependencies,
            });

            logger.info({ 
                pluginName: plugin.name, 
                version: plugin.version,
                agentTypes: plugin.agentTypes 
            }, "Plugin registered successfully");

            return true;

        } catch (error) {
            logger.error({ error, pluginName: plugin.name }, "Failed to register plugin");
            return false;
        }
    }

    /**
     * Execute plugin
     */
    async executePlugin(
        pluginName: string,
        context: PluginContext,
        retryCount = 0
    ): Promise<PluginResult> {
        const startTime = Date.now();
        
        try {
            const plugin = this.plugins.get(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }

            const config = this.pluginConfigs.get(pluginName);
            if (!config?.enabled) {
                throw new Error(`Plugin ${pluginName} is disabled`);
            }

            // Validate input if plugin has validator
            if (plugin.validate && !plugin.validate(context.input)) {
                throw new Error(`Plugin ${pluginName} input validation failed`);
            }

            // Execute plugin with timeout
            const result = await Promise.race([
                plugin.execute(context),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error(`Plugin ${pluginName} timed out`)), config.timeout)
                ),
            ]);

            const executionTime = Date.now() - startTime;

            // Track telemetry
            await this.telemetryService.trackAgentExecution(
                pluginName,
                "plugin_execution",
                result.success,
                executionTime,
                result.errors.join(", ") || undefined
            );

            logger.info({
                pluginName,
                executionTime,
                success: result.success,
            }, "Plugin executed successfully");

            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = (error as Error).message;

            // Retry if configured
            const config = this.pluginConfigs.get(pluginName);
            if (retryCount < (config?.retryAttempts || 0)) {
                logger.warn({ 
                    pluginName, 
                    retryCount, 
                    error: errorMessage 
                }, "Plugin execution failed, retrying");
                
                await this.delay(1000 * (retryCount + 1)); // Exponential backoff
                return this.executePlugin(pluginName, context, retryCount + 1);
            }

            // Track error
            await this.telemetryService.trackAgentExecution(
                pluginName,
                "plugin_execution",
                false,
                executionTime,
                errorMessage
            );

            logger.error({ 
                pluginName, 
                error: errorMessage, 
                executionTime 
            }, "Plugin execution failed");

            return {
                success: false,
                output: {},
                errors: [errorMessage],
                warnings: [],
                executionTime,
            };
        }
    }

    /**
     * Execute multiple plugins in parallel
     */
    async executePluginsParallel(
        pluginNames: string[],
        context: PluginContext
    ): Promise<Map<string, PluginResult>> {
        const results = new Map<string, PluginResult>();
        
        const promises = pluginNames.map(async (pluginName) => {
            try {
                const result = await this.executePlugin(pluginName, context);
                results.set(pluginName, result);
            } catch (error) {
                results.set(pluginName, {
                    success: false,
                    output: {},
                    errors: [(error as Error).message],
                    warnings: [],
                    executionTime: 0,
                });
            }
        });

        await Promise.allSettled(promises);
        return results;
    }

    /**
     * Execute plugins in sequence based on priority
     */
    async executePluginsSequence(
        pluginNames: string[],
        context: PluginContext
    ): Promise<Map<string, PluginResult>> {
        const results = new Map<string, PluginResult>();
        
        // Sort by priority (higher priority first)
        const sortedPlugins = pluginNames.sort((a, b) => {
            const configA = this.pluginConfigs.get(a);
            const configB = this.pluginConfigs.get(b);
            return (configB?.priority || 0) - (configA?.priority || 0);
        });

        for (const pluginName of sortedPlugins) {
            try {
                const result = await this.executePlugin(pluginName, context);
                results.set(pluginName, result);
                
                // Stop on critical failure if configured
                if (!result.success && this.isCriticalPlugin(pluginName)) {
                    logger.error({ pluginName }, "Critical plugin failed, stopping sequence");
                    break;
                }
            } catch (error) {
                results.set(pluginName, {
                    success: false,
                    output: {},
                    errors: [(error as Error).message],
                    warnings: [],
                    executionTime: 0,
                });
            }
        }

        return results;
    }

    /**
     * Get plugin information
     */
    getPluginInfo(pluginName: string): {
        plugin: RenosPlugin | undefined;
        config: PluginConfig | undefined;
        status: "registered" | "not_found" | "disabled";
    } {
        const plugin = this.plugins.get(pluginName);
        const config = this.pluginConfigs.get(pluginName);
        
        if (!plugin) {
            return { plugin: undefined, config: undefined, status: "not_found" };
        }
        
        if (!config?.enabled) {
            return { plugin, config, status: "disabled" };
        }
        
        return { plugin, config, status: "registered" };
    }

    /**
     * List all registered plugins
     */
    listPlugins(): Array<{
        name: string;
        version: string;
        description: string;
        status: "enabled" | "disabled";
        agentTypes: string[];
    }> {
        return Array.from(this.plugins.entries()).map(([name, plugin]) => {
            const config = this.pluginConfigs.get(name);
            return {
                name,
                version: plugin.version,
                description: plugin.description,
                status: config?.enabled ? "enabled" : "disabled",
                agentTypes: plugin.agentTypes,
            };
        });
    }

    /**
     * Update plugin configuration
     */
    updatePluginConfig(pluginName: string, config: Partial<PluginConfig>): boolean {
        const existingConfig = this.pluginConfigs.get(pluginName);
        if (!existingConfig) {
            logger.error({ pluginName }, "Plugin not found for config update");
            return false;
        }

        this.pluginConfigs.set(pluginName, { ...existingConfig, ...config });
        
        logger.info({ pluginName, config }, "Plugin configuration updated");
        return true;
    }

    /**
     * Unregister plugin
     */
    async unregisterPlugin(pluginName: string): Promise<boolean> {
        try {
            const plugin = this.plugins.get(pluginName);
            if (!plugin) {
                logger.warn({ pluginName }, "Plugin not found for unregistration");
                return false;
            }

            // Cleanup plugin
            if (plugin.cleanup) {
                await plugin.cleanup();
            }

            // Remove from registries
            this.plugins.delete(pluginName);
            this.pluginConfigs.delete(pluginName);

            logger.info({ pluginName }, "Plugin unregistered successfully");
            return true;

        } catch (error) {
            logger.error({ error, pluginName }, "Failed to unregister plugin");
            return false;
        }
    }

    /**
     * Get plugin health status
     */
    getPluginHealth(): {
        totalPlugins: number;
        enabledPlugins: number;
        disabledPlugins: number;
        unhealthyPlugins: string[];
    } {
        const plugins = Array.from(this.plugins.keys());
        const enabledPlugins = plugins.filter(name => 
            this.pluginConfigs.get(name)?.enabled
        );
        const disabledPlugins = plugins.filter(name => 
            !this.pluginConfigs.get(name)?.enabled
        );

        // This would check actual plugin health
        const unhealthyPlugins: string[] = [];

        return {
            totalPlugins: plugins.length,
            enabledPlugins: enabledPlugins.length,
            disabledPlugins: disabledPlugins.length,
            unhealthyPlugins,
        };
    }

    // Private helper methods
    private validatePlugin(plugin: RenosPlugin): boolean {
        if (!plugin.name || !plugin.version || !plugin.execute) {
            return false;
        }
        
        if (typeof plugin.execute !== "function") {
            return false;
        }
        
        return true;
    }

    private async checkDependencies(dependencies: string[]): Promise<string[]> {
        const missing: string[] = [];
        
        for (const dep of dependencies) {
            if (!this.plugins.has(dep)) {
                missing.push(dep);
            }
        }
        
        return missing;
    }

    private isCriticalPlugin(pluginName: string): boolean {
        // Define critical plugins that should stop execution on failure
        const criticalPlugins = ["intent-classifier", "task-planner"];
        return criticalPlugins.includes(pluginName);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
let pluginManager: RenosPluginManager | null = null;

/**
 * Get the plugin manager instance
 */
export function getPluginManager(): RenosPluginManager {
    if (!pluginManager) {
        pluginManager = new RenosPluginManager();
    }
    return pluginManager;
}