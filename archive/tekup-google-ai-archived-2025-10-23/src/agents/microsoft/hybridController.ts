import { logger } from "../../logger";
import { getAgentOrchestrator, type AgentOrchestrationResult } from "./agentOrchestrator";
import { getThreadManager } from "./threadManager";
import { getTelemetryService } from "./telemetryService";
import { getPluginManager } from "./pluginManager";
import type { ChatMessage, ChatSessionContext, LeadInformation, AssistantResponse } from "../../types";

/**
 * Microsoft Agent Framework Hybrid Controller
 * 
 * Provides gradual migration from existing Renos system to Microsoft Agent Framework
 * Uses feature flags to enable/disable Microsoft features
 */

export interface HybridConfig {
    enableMicrosoftOrchestration: boolean;
    enableThreadManagement: boolean;
    enableTelemetry: boolean;
    enablePluginSystem: boolean;
    fallbackToLegacy: boolean;
    debugMode: boolean;
}

export interface HybridProcessingResult {
    success: boolean;
    response: string;
    method: "microsoft" | "legacy" | "hybrid";
    executionTime: number;
    threadId?: string;
    errors: string[];
    metadata: {
        agentsUsed: string[];
        pluginsUsed: string[];
        telemetryTracked: boolean;
    };
}

/**
 * Hybrid Controller for Microsoft Agent Framework Integration
 */
export class RenosHybridController {
    private orchestrator = getAgentOrchestrator();
    private threadManager = getThreadManager();
    private telemetryService = getTelemetryService();
    private pluginManager = getPluginManager();
    private config: HybridConfig;

    constructor(config?: Partial<HybridConfig>) {
        this.config = {
            enableMicrosoftOrchestration: config?.enableMicrosoftOrchestration ?? false,
            enableThreadManagement: config?.enableThreadManagement ?? false,
            enableTelemetry: config?.enableTelemetry ?? false,
            enablePluginSystem: config?.enablePluginSystem ?? false,
            fallbackToLegacy: config?.fallbackToLegacy ?? true,
            debugMode: config?.debugMode ?? false,
        };

        logger.info({ config: this.config }, "Hybrid controller initialized");
    }

    /**
     * Process chat message with hybrid approach
     */
    async processMessage(
        message: string,
        context: ChatSessionContext,
        lead?: LeadInformation,
        history: ChatMessage[] = []
    ): Promise<HybridProcessingResult> {
        const startTime = Date.now();
        
        try {
            // Determine processing method based on configuration and complexity
            const processingMethod = this.determineProcessingMethod(message, context, lead);
            
            logger.info({
                method: processingMethod,
                hasLead: !!lead,
                messageLength: message.length,
            }, "Processing message with hybrid approach");

            let result: HybridProcessingResult;

            switch (processingMethod) {
                case "microsoft":
                    result = await this.processWithMicrosoft(message, context, lead, history);
                    break;
                case "hybrid":
                    result = await this.processWithHybrid(message, context, lead, history);
                    break;
                case "legacy":
                default:
                    result = await this.processWithLegacy(message, context, lead, history);
                    break;
            }

            result.executionTime = Date.now() - startTime;

            // Track telemetry if enabled
            if (this.config.enableTelemetry) {
                await this.trackProcessingResult(result, context, lead);
            }

            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = (error as Error).message;

            logger.error({ error, executionTime }, "Hybrid processing failed");

            return {
                success: false,
                response: `Beklager, der opstod en fejl: ${errorMessage}`,
                method: "legacy",
                executionTime,
                errors: [errorMessage],
                metadata: {
                    agentsUsed: [],
                    pluginsUsed: [],
                    telemetryTracked: false,
                },
            };
        }
    }

    /**
     * Process with Microsoft Agent Framework
     */
    private async processWithMicrosoft(
        message: string,
        context: ChatSessionContext,
        lead?: LeadInformation,
        history: ChatMessage[] = []
    ): Promise<HybridProcessingResult> {
        const startTime = Date.now();
        
        try {
            let orchestrationResult: AgentOrchestrationResult;

            if (lead) {
                // Complex lead processing with multi-agent orchestration
                orchestrationResult = await this.orchestrator.processComplexLead(
                    message,
                    lead,
                    context,
                    history
                );
            } else {
                // Simple message processing
                orchestrationResult = await this.orchestrator.processSimpleMessage(
                    message,
                    context,
                    history
                );
            }

            return {
                success: orchestrationResult.success,
                response: orchestrationResult.response,
                method: "microsoft",
                executionTime: Date.now() - startTime,
                threadId: orchestrationResult.threadId,
                errors: orchestrationResult.errors,
                metadata: {
                    agentsUsed: this.extractAgentTypes(orchestrationResult.actions),
                    pluginsUsed: [],
                    telemetryTracked: this.config.enableTelemetry,
                },
            };

        } catch (error) {
            logger.error({ error }, "Microsoft processing failed");
            
            if (this.config.fallbackToLegacy) {
                logger.info("Falling back to legacy processing");
                return this.processWithLegacy(message, context, lead, history);
            }
            
            throw error;
        }
    }

    /**
     * Process with hybrid approach (Microsoft + Legacy)
     */
    private async processWithHybrid(
        message: string,
        context: ChatSessionContext,
        lead?: LeadInformation,
        history: ChatMessage[] = []
    ): Promise<HybridProcessingResult> {
        const startTime = Date.now();
        
        try {
            // Use Microsoft thread management if enabled
            let threadId: string | undefined;
            if (this.config.enableThreadManagement) {
                threadId = await this.getOrCreateThreadId(context, lead);
            }

            // Use Microsoft orchestration for complex cases
            let microsoftResult: AgentOrchestrationResult | null = null;
            if (this.shouldUseMicrosoftOrchestration(message, lead)) {
                try {
                    if (lead) {
                        microsoftResult = await this.orchestrator.processComplexLead(
                            message,
                            lead,
                            context,
                            history
                        );
                    } else {
                        microsoftResult = await this.orchestrator.processSimpleMessage(
                            message,
                            context,
                            history
                        );
                    }
                } catch (error) {
                    logger.warn({ error }, "Microsoft orchestration failed, continuing with legacy");
                }
            }

            // Use legacy processing as fallback or primary
            const legacyResult = await this.processWithLegacy(message, context, lead, history);

            // Combine results
            const response = microsoftResult?.response || legacyResult.response;
            const success = microsoftResult?.success || legacyResult.success;
            const errors = [
                ...(microsoftResult?.errors || []),
                ...legacyResult.errors,
            ];

            return {
                success,
                response,
                method: "hybrid",
                executionTime: Date.now() - startTime,
                threadId,
                errors,
                metadata: {
                    agentsUsed: microsoftResult ? this.extractAgentTypes(microsoftResult.actions) : [],
                    pluginsUsed: [],
                    telemetryTracked: this.config.enableTelemetry,
                },
            };

        } catch (error) {
            logger.error({ error }, "Hybrid processing failed");
            return this.processWithLegacy(message, context, lead, history);
        }
    }

    /**
     * Process with legacy Renos system
     */
    private async processWithLegacy(
        message: string,
        context: ChatSessionContext,
        lead: LeadInformation | undefined,
        history: ChatMessage[] = []
    ): Promise<HybridProcessingResult> {
        const startTime = Date.now();
        
        try {
            // Import legacy components dynamically to avoid circular dependencies
            const { IntentClassifier } = await import("../intentClassifier");
            const { TaskPlanner } = await import("../taskPlanner");
            const { PlanExecutor } = await import("../planExecutor");
            const { OpenAiProvider } = await import("../../llm/openAiProvider");
            const { appConfig } = await import("../../config");

            // Initialize legacy components
            const llmProvider = appConfig.llm.OPENAI_API_KEY 
                ? new OpenAiProvider(appConfig.llm.OPENAI_API_KEY)
                : undefined;

            const classifier = new IntentClassifier({ 
                llm: llmProvider, 
                threshold: 0.7 
            });
            const planner = new TaskPlanner();
            const executor = new PlanExecutor();

            // Process with legacy system
            const intent = await classifier.classify(message, history);
            const plan = planner.plan({
                intent,
                message,
                context,
                lead,
            });
            const execution = await executor.execute(plan);

            return {
                success: true,
                response: execution.summary,
                method: "legacy",
                executionTime: Date.now() - startTime,
                errors: [],
                metadata: {
                    agentsUsed: ["intent-classifier", "task-planner", "plan-executor"],
                    pluginsUsed: [],
                    telemetryTracked: false,
                },
            };

        } catch (error) {
            logger.error({ error }, "Legacy processing failed");
            
            return {
                success: false,
                response: `Beklager, der opstod en fejl: ${(error as Error).message}`,
                method: "legacy",
                executionTime: Date.now() - startTime,
                errors: [(error as Error).message],
                metadata: {
                    agentsUsed: [],
                    pluginsUsed: [],
                    telemetryTracked: false,
                },
            };
        }
    }

    /**
     * Determine processing method based on configuration and complexity
     */
    private determineProcessingMethod(
        message: string,
        context: ChatSessionContext,
        lead?: LeadInformation
    ): "microsoft" | "hybrid" | "legacy" {
        // Force legacy if Microsoft features are disabled
        if (!this.config.enableMicrosoftOrchestration && !this.config.enableThreadManagement) {
            return "legacy";
        }

        // Use Microsoft for complex leads
        if (lead && this.isComplexLead(lead)) {
            return this.config.enableMicrosoftOrchestration ? "microsoft" : "hybrid";
        }

        // Use Microsoft for complex messages
        if (this.isComplexMessage(message)) {
            return this.config.enableMicrosoftOrchestration ? "microsoft" : "hybrid";
        }

        // Use hybrid for gradual migration
        if (this.config.enableMicrosoftOrchestration || this.config.enableThreadManagement) {
            return "hybrid";
        }

        // Default to legacy
        return "legacy";
    }

    /**
     * Check if lead is complex enough for Microsoft processing
     */
    private isComplexLead(lead: LeadInformation): boolean {
        let complexity = 0;
        
        if (lead.squareMeters && lead.squareMeters > 200) complexity += 2;
        if (lead.rooms && lead.rooms > 5) complexity += 1;
        if (lead.taskType?.includes("Flytterengøring")) complexity += 2;
        if (lead.address) complexity += 1;
        if (lead.preferredDates && lead.preferredDates.length > 1) complexity += 1;
        
        return complexity >= 3;
    }

    /**
     * Check if message is complex enough for Microsoft processing
     */
    private isComplexMessage(message: string): boolean {
        const complexKeywords = [
            "kompleks", "avanceret", "speciel", "kompliceret",
            "flere", "forskellige", "kombination", "samtidig"
        ];
        
        const lowerMessage = message.toLowerCase();
        return complexKeywords.some(keyword => lowerMessage.includes(keyword)) || message.length > 200;
    }

    /**
     * Check if Microsoft orchestration should be used
     */
    private shouldUseMicrosoftOrchestration(message: string, lead?: LeadInformation): boolean {
        return this.config.enableMicrosoftOrchestration && 
               (this.isComplexMessage(message) || (lead && this.isComplexLead(lead)));
    }

    /**
     * Get or create thread ID
     */
    private async getOrCreateThreadId(
        context: ChatSessionContext,
        lead?: LeadInformation
    ): Promise<string> {
        if (!this.config.enableThreadManagement) {
            return `legacy_${Date.now()}`;
        }

        try {
            const thread = await this.threadManager.getOrCreateThread(
                context.userId ? `customer_${context.userId}` : undefined,
                lead?.email ? `lead_${lead.email}` : undefined
            );
            return thread.threadId;
        } catch (error) {
            logger.warn({ error }, "Failed to get/create thread, using fallback");
            return `fallback_${Date.now()}`;
        }
    }

    /**
     * Extract agent types from actions
     */
    private extractAgentTypes(actions: any[]): string[] {
        return [...new Set(actions.map(action => action.agentType || "unknown"))];
    }

    /**
     * Track processing result for telemetry
     */
    private async trackProcessingResult(
        result: HybridProcessingResult,
        context: ChatSessionContext,
        lead?: LeadInformation
    ): Promise<void> {
        try {
            await this.telemetryService.trackAgentExecution(
                "hybrid-controller",
                "process-message",
                result.success,
                result.executionTime,
                result.errors.join(", ") || undefined
            );

            if (lead) {
                await this.telemetryService.trackCustomerInteraction(
                    lead.email || "unknown",
                    "lead",
                    undefined,
                    result.executionTime / 1000
                );
            }
        } catch (error) {
            logger.warn({ error }, "Failed to track processing result");
        }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<HybridConfig>): void {
        this.config = { ...this.config, ...config };
        logger.info({ config: this.config }, "Hybrid controller configuration updated");
    }

    /**
     * Get current configuration
     */
    getConfig(): HybridConfig {
        return { ...this.config };
    }

    /**
     * Get processing statistics
     */
    getProcessingStats(): {
        totalProcessed: number;
        microsoftProcessed: number;
        hybridProcessed: number;
        legacyProcessed: number;
        averageExecutionTime: number;
        successRate: number;
    } {
        // This would track actual statistics
        return {
            totalProcessed: 0,
            microsoftProcessed: 0,
            hybridProcessed: 0,
            legacyProcessed: 0,
            averageExecutionTime: 0,
            successRate: 0,
        };
    }
}

// Singleton instance
let hybridController: RenosHybridController | null = null;

/**
 * Get the hybrid controller instance
 */
export function getHybridController(config?: Partial<HybridConfig>): RenosHybridController {
    if (!hybridController) {
        hybridController = new RenosHybridController(config);
    }
    return hybridController;
}