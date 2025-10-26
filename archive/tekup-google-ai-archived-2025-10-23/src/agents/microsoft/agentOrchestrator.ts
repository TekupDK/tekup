import { logger } from "../../logger";
import { getThreadManager, type RenosThread, type AgentAction } from "./threadManager";
import { IntentClassifier } from "../intentClassifier";
import { TaskPlanner } from "../taskPlanner";
import { PlanExecutor } from "../planExecutor";
import { OpenAiProvider } from "../../llm/openAiProvider";
import { appConfig } from "../../config";
import type { ChatMessage, LeadInformation, ClassifiedIntent, PlannedTask, ExecutionResult, ChatSessionContext } from "../../types";

/**
 * Microsoft Agent Framework Multi-Agent Orchestration
 * 
 * Coordinates multiple specialized agents for complex workflows
 * Enables parallel processing and better coordination
 */

export interface AgentOrchestrationResult {
    success: boolean;
    response: string;
    actions: AgentAction[];
    threadId: string;
    executionTime: number;
    errors: string[];
}

export interface AgentConfig {
    enableParallelProcessing: boolean;
    maxConcurrentAgents: number;
    timeoutMs: number;
    retryAttempts: number;
}

/**
 * Multi-Agent Orchestrator for Renos
 */
export class RenosAgentOrchestrator {
    private threadManager = getThreadManager();
    private intentClassifier: IntentClassifier;
    private taskPlanner: TaskPlanner;
    private planExecutor: PlanExecutor;
    private config: AgentConfig;

    constructor(config?: Partial<AgentConfig>) {
        this.config = {
            enableParallelProcessing: config?.enableParallelProcessing ?? true,
            maxConcurrentAgents: config?.maxConcurrentAgents ?? 5,
            timeoutMs: config?.timeoutMs ?? 30000,
            retryAttempts: config?.retryAttempts ?? 2,
        };

        // Initialize LLM provider
        const llmProvider = appConfig.llm.OPENAI_API_KEY 
            ? new OpenAiProvider(appConfig.llm.OPENAI_API_KEY)
            : undefined;

        this.intentClassifier = new IntentClassifier({ 
            llm: llmProvider, 
            threshold: 0.7 
        });
        this.taskPlanner = new TaskPlanner();
        this.planExecutor = new PlanExecutor();
    }

    /**
     * Process complex lead with multi-agent coordination
     */
    async processComplexLead(
        message: string,
        lead: LeadInformation,
        context: ChatSessionContext,
        history: ChatMessage[] = []
    ): Promise<AgentOrchestrationResult> {
        const startTime = Date.now();
        const threadId = await this.getOrCreateThreadId(lead.email, lead.name);
        
        logger.info({ threadId, leadId: lead.email }, "Starting complex lead processing with multi-agent orchestration");

        try {
            // Get or create thread
            const thread = await this.threadManager.getOrCreateThread(
                undefined, // customerId - will be determined later
                undefined, // leadId - will be created
                undefined  // conversationId
            );

            // Update thread with lead information
            await this.updateThreadWithLead(thread, lead);

            // Parallel agent execution
            const agentResults = await this.executeParallelAgents(thread, message, lead, context, history);

            // Combine results
            const response = this.combineAgentResults(agentResults);
            const executionTime = Date.now() - startTime;

            // Log orchestration result
            await this.threadManager.addAgentAction(
                threadId,
                "plan-executor",
                "multi-agent-orchestration",
                { message, lead, agentCount: agentResults.length },
                { response, executionTime, success: true },
                "success",
                executionTime
            );

            return {
                success: true,
                response,
                actions: thread.agentHistory,
                threadId,
                executionTime,
                errors: [],
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = (error as Error).message;

            logger.error({ error, threadId, executionTime }, "Multi-agent orchestration failed");

            await this.threadManager.addAgentAction(
                threadId,
                "plan-executor",
                "multi-agent-orchestration",
                { message, lead },
                { error: errorMessage },
                "failed",
                executionTime,
                errorMessage
            );

            return {
                success: false,
                response: `Beklager, der opstod en fejl under behandling af din henvendelse: ${errorMessage}`,
                actions: [],
                threadId,
                executionTime,
                errors: [errorMessage],
            };
        }
    }

    /**
     * Process simple message with standard flow
     */
    async processSimpleMessage(
        message: string,
        context: ChatSessionContext,
        history: ChatMessage[] = []
    ): Promise<AgentOrchestrationResult> {
        const startTime = Date.now();
        const threadId = await this.getOrCreateThreadId(context.userId);

        try {
            // Standard single-agent flow
            const intent = await this.intentClassifier.classify(message, history);
            const plan = this.taskPlanner.plan({
                intent,
                message,
                context,
            });
            const execution = await this.planExecutor.execute(plan);

            const response = execution.summary;
            const executionTime = Date.now() - startTime;

            return {
                success: true,
                response,
                actions: [],
                threadId,
                executionTime,
                errors: [],
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = (error as Error).message;

            return {
                success: false,
                response: `Beklager, der opstod en fejl: ${errorMessage}`,
                actions: [],
                threadId,
                executionTime,
                errors: [errorMessage],
            };
        }
    }

    /**
     * Execute multiple agents in parallel
     */
    private async executeParallelAgents(
        thread: RenosThread,
        message: string,
        lead: LeadInformation,
        context: ChatSessionContext,
        history: ChatMessage[]
    ): Promise<AgentResult[]> {
        const agents = [
            this.createIntentAgent(thread, message, history),
            this.createLeadAnalysisAgent(thread, lead),
            this.createPricingAgent(thread, lead),
            this.createCalendarAgent(thread, lead),
            this.createEmailCompositionAgent(thread, lead),
        ];

        if (this.config.enableParallelProcessing) {
            // Execute agents in parallel with timeout
            const promises = agents.map(agent => 
                this.executeAgentWithTimeout(agent, this.config.timeoutMs)
            );
            
            const results = await Promise.allSettled(promises);
            return results
                .filter((result): result is PromiseFulfilledResult<AgentResult> => 
                    result.status === "fulfilled"
                )
                .map(result => result.value);
        } else {
            // Execute agents sequentially
            const results: AgentResult[] = [];
            for (const agent of agents) {
                try {
                    const result = await this.executeAgentWithTimeout(agent, this.config.timeoutMs);
                    results.push(result);
                } catch (error) {
                    logger.warn({ error, agentType: agent.type }, "Agent execution failed");
                }
            }
            return results;
        }
    }

    /**
     * Create intent classification agent
     */
    private createIntentAgent(thread: RenosThread, message: string, history: ChatMessage[]): Agent {
        return {
            type: "intent-classifier",
            name: "IntentClassifier",
            execute: async () => {
                const startTime = Date.now();
                const intent = await this.intentClassifier.classify(message, history);
                const duration = Date.now() - startTime;

                await this.threadManager.addAgentAction(
                    thread.threadId,
                    "intent-classifier",
                    "classify-intent",
                    { message },
                    { intent },
                    "success",
                    duration
                );

                return {
                    type: "intent-classifier",
                    result: intent,
                    confidence: intent.confidence,
                    duration,
                };
            },
        };
    }

    /**
     * Create lead analysis agent
     */
    private createLeadAnalysisAgent(thread: RenosThread, lead: LeadInformation): Agent {
        return {
            type: "lead-analysis",
            name: "LeadAnalysisAgent",
            execute: async () => {
                const startTime = Date.now();
                
                // Analyze lead complexity and requirements
                const analysis = {
                    complexity: this.analyzeLeadComplexity(lead),
                    requirements: this.extractLeadRequirements(lead),
                    priority: this.determineLeadPriority(lead),
                    estimatedProcessingTime: this.estimateProcessingTime(lead),
                };

                const duration = Date.now() - startTime;

                await this.threadManager.addAgentAction(
                    thread.threadId,
                    "email-agent",
                    "analyze-lead",
                    { lead },
                    { analysis },
                    "success",
                    duration
                );

                return {
                    type: "lead-analysis",
                    result: analysis,
                    confidence: 0.9,
                    duration,
                };
            },
        };
    }

    /**
     * Create pricing agent
     */
    private createPricingAgent(thread: RenosThread, lead: LeadInformation): Agent {
        return {
            type: "pricing",
            name: "PricingAgent",
            execute: async () => {
                const startTime = Date.now();
                
                // Calculate pricing based on lead information
                const pricing = this.calculatePricing(lead);
                
                const duration = Date.now() - startTime;

                await this.threadManager.addAgentAction(
                    thread.threadId,
                    "pricing-agent",
                    "calculate-pricing",
                    { lead },
                    { pricing },
                    "success",
                    duration
                );

                return {
                    type: "pricing",
                    result: pricing,
                    confidence: 0.85,
                    duration,
                };
            },
        };
    }

    /**
     * Create calendar agent
     */
    private createCalendarAgent(thread: RenosThread, lead: LeadInformation): Agent {
        return {
            type: "calendar",
            name: "CalendarAgent",
            execute: async () => {
                const startTime = Date.now();
                
                // Find available slots
                const availableSlots = await this.findAvailableSlots(lead);
                
                const duration = Date.now() - startTime;

                await this.threadManager.addAgentAction(
                    thread.threadId,
                    "calendar-agent",
                    "find-slots",
                    { lead },
                    { availableSlots },
                    "success",
                    duration
                );

                return {
                    type: "calendar",
                    result: availableSlots,
                    confidence: 0.9,
                    duration,
                };
            },
        };
    }

    /**
     * Create email composition agent
     */
    private createEmailCompositionAgent(thread: RenosThread, lead: LeadInformation): Agent {
        return {
            type: "email-composition",
            name: "EmailCompositionAgent",
            execute: async () => {
                const startTime = Date.now();
                
                // Generate email content
                const emailContent = await this.generateEmailContent(lead);
                
                const duration = Date.now() - startTime;

                await this.threadManager.addAgentAction(
                    thread.threadId,
                    "email-agent",
                    "compose-email",
                    { lead },
                    { emailContent },
                    "success",
                    duration
                );

                return {
                    type: "email-composition",
                    result: emailContent,
                    confidence: 0.8,
                    duration,
                };
            },
        };
    }

    /**
     * Execute agent with timeout
     */
    private async executeAgentWithTimeout(agent: Agent, timeoutMs: number): Promise<AgentResult> {
        return Promise.race([
            agent.execute(),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error(`Agent ${agent.name} timed out`)), timeoutMs)
            ),
        ]);
    }

    /**
     * Combine results from multiple agents
     */
    private combineAgentResults(results: AgentResult[]): string {
        const intentResult = results.find(r => r.type === "intent-classifier");
        const leadResult = results.find(r => r.type === "lead-analysis");
        const pricingResult = results.find(r => r.type === "pricing");
        const calendarResult = results.find(r => r.type === "calendar");
        const emailResult = results.find(r => r.type === "email-composition");

        let response = "Tak for din henvendelse! Jeg har analyseret din forespørgsel og forberedt et tilbud.\n\n";

        if (pricingResult) {
            const pricing = pricingResult.result as any;
            response += `💰 **Prisestimat:** ${pricing.priceMin}-${pricing.priceMax} kr\n`;
            response += `⏱️ **Estimeret tid:** ${pricing.estimatedHours} timer med ${pricing.workers} personer\n\n`;
        }

        if (calendarResult) {
            const slots = calendarResult.result as any[];
            if (slots && slots.length > 0) {
                response += `📅 **Ledige tider:**\n`;
                slots.slice(0, 5).forEach((slot, index) => {
                    const date = new Date(slot.start).toLocaleDateString("da-DK");
                    const time = new Date(slot.start).toLocaleTimeString("da-DK", { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                    });
                    response += `${index + 1}. ${date} kl. ${time}\n`;
                });
                response += "\n";
            }
        }

        if (leadResult) {
            const analysis = leadResult.result as any;
            if (analysis.complexity === "high") {
                response += `⚠️ **Kompleks opgave:** ${analysis.requirements.join(", ")}\n\n`;
            }
        }

        response += "Hvilken tid passer bedst for dig? Jeg kan hjælpe med at booke en tid der passer dig.\n\n";
        response += "Med venlig hilsen,\nRenos AI Assistant";

        return response;
    }

    /**
     * Update thread with lead information
     */
    private async updateThreadWithLead(thread: RenosThread, lead: LeadInformation): Promise<void> {
        thread.businessContext.currentLead = lead;
        thread.businessContext.leadHistory.push(lead);
        
        await this.threadManager.updateThread(thread.threadId, {
            businessContext: thread.businessContext,
        });
    }

    /**
     * Get or create thread ID
     */
    private async getOrCreateThreadId(identifier?: string, name?: string): Promise<string> {
        if (identifier) {
            return `thread_${identifier}_${Date.now()}`;
        }
        return `thread_${Date.now()}`;
    }

    // Helper methods for agent implementations
    private analyzeLeadComplexity(lead: LeadInformation): "low" | "medium" | "high" {
        let score = 0;
        if (lead.squareMeters && lead.squareMeters > 200) score += 2;
        if (lead.rooms && lead.rooms > 5) score += 1;
        if (lead.taskType?.includes("Flytterengøring")) score += 2;
        if (lead.address) score += 1;
        
        if (score >= 4) return "high";
        if (score >= 2) return "medium";
        return "low";
    }

    private extractLeadRequirements(lead: LeadInformation): string[] {
        const requirements: string[] = [];
        if (lead.squareMeters) requirements.push(`${lead.squareMeters}m² rengøring`);
        if (lead.rooms) requirements.push(`${lead.rooms} rum`);
        if (lead.taskType) requirements.push(lead.taskType);
        if (lead.address) requirements.push(`Adresse: ${lead.address}`);
        return requirements;
    }

    private determineLeadPriority(lead: LeadInformation): "low" | "medium" | "high" {
        if (lead.taskType?.includes("Flytterengøring")) return "high";
        if (lead.squareMeters && lead.squareMeters > 150) return "medium";
        return "low";
    }

    private estimateProcessingTime(lead: LeadInformation): number {
        let baseTime = 2; // minutes
        if (lead.squareMeters && lead.squareMeters > 200) baseTime += 2;
        if (lead.taskType?.includes("Flytterengøring")) baseTime += 3;
        return baseTime;
    }

    private calculatePricing(lead: LeadInformation): any {
        const hourlyRate = 349;
        const baseHours = Math.max(lead.squareMeters ? lead.squareMeters / 35 : 2, 2);
        const workers = 2;
        const estimatedHours = Math.round(baseHours * 2) / 2;
        const totalLaborHours = estimatedHours * workers;
        const basePrice = totalLaborHours * hourlyRate;
        
        return {
            estimatedHours,
            workers,
            totalLaborHours,
            priceMin: Math.round(basePrice * 0.8),
            priceMax: Math.round(basePrice * 1.2),
            hourlyRate,
        };
    }

    private async findAvailableSlots(lead: LeadInformation): Promise<any[]> {
        // This would integrate with the existing slot finder service
        return [
            { start: new Date(Date.now() + 24 * 60 * 60 * 1000), end: new Date(Date.now() + 25 * 60 * 60 * 1000) },
            { start: new Date(Date.now() + 48 * 60 * 60 * 1000), end: new Date(Date.now() + 49 * 60 * 60 * 1000) },
        ];
    }

    private async generateEmailContent(lead: LeadInformation): Promise<any> {
        return {
            subject: `Tilbud på ${lead.taskType || "rengøring"}`,
            body: `Hej ${lead.name || "der"},\n\nTak for din henvendelse...`,
            to: lead.email,
        };
    }
}

// Type definitions
interface Agent {
    type: string;
    name: string;
    execute: () => Promise<AgentResult>;
}

interface AgentResult {
    type: string;
    result: any;
    confidence: number;
    duration: number;
}

// Singleton instance
let orchestrator: RenosAgentOrchestrator | null = null;

/**
 * Get the agent orchestrator instance
 */
export function getAgentOrchestrator(config?: Partial<AgentConfig>): RenosAgentOrchestrator {
    if (!orchestrator) {
        orchestrator = new RenosAgentOrchestrator(config);
    }
    return orchestrator;
}