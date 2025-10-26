import type { PlannedTask, ExecutionResult } from "../types";
import { logger } from "../logger";
import { tracer } from "./executionTracer";
import { reflector } from "./agentReflector";
import { prisma } from "../services/databaseService";
import {
    handleEmailCompose,
    handleComplaintEmail,
    handleEmailFollowUp,
    handleCalendarBook,
    handleCalendarReschedule,
    handleMemoryUpdate,
    handleAutomationUpdate,
    handleAnalytics,
    type TaskHandler,
    type ExecutionAction,
} from "./handlers";

interface TaskOutcome {
    action: ExecutionAction;
    stop: boolean;
}

// Legacy handlers (backward compatibility)
const defaultHandlers: Record<string, TaskHandler> = {
    "email.compose": handleEmailCompose,
    "email.followup": handleEmailFollowUp,
    "email.resolveComplaint": handleComplaintEmail,
    "calendar.book": handleCalendarBook,
    "calendar.reschedule": handleCalendarReschedule,
    "memory.update": handleMemoryUpdate,
    "automation.updateRule": handleAutomationUpdate,
    "analytics.generate": handleAnalytics,
};

/**
 * Plan Executor with Tool Registry Support
 * 
 * HYBRID MODE:
 * - Legacy handlers for existing task types (backward compatible)
 * - Tool Registry for new ADK-style tools (future-ready)
 * 
 * Tool Registry can be enabled by setting useToolRegistry=true
 * This allows dynamic tool discovery and execution without hardcoded handlers
 */
export class PlanExecutor {
    private readonly handlers: Record<string, TaskHandler>;
    private useToolRegistry: boolean;

    constructor(
        overrides: Record<string, TaskHandler> = {},
        options: { useToolRegistry?: boolean } = {}
    ) {
        this.handlers = { ...defaultHandlers, ...overrides };
        this.useToolRegistry = options.useToolRegistry ?? false;

        if (this.useToolRegistry) {
            logger.info("PlanExecutor initialized with Tool Registry support");
        }
    }

    async execute(plan: PlannedTask[]): Promise<ExecutionResult> {
        const actions: ExecutionAction[] = [];

        // Start execution trace
        const traceId = tracer.startTrace(`plan_${Date.now()}`, "plan_execution");
        tracer.recordStep(traceId, {
            name: "start_plan_execution",
            status: "success",
            metadata: { taskCount: plan.length },
        });

        try {
            for (const task of plan) {
                tracer.recordStep(traceId, {
                    name: `execute_${task.type}`,
                    status: "running",
                    metadata: { taskId: task.id, taskType: task.type },
                });

                const startTime = Date.now();
                let outcome = await this.runTask(task);
                const duration = Date.now() - startTime;

                // Create TaskExecution audit record in database
                try {
                    await prisma.taskExecution.create({
                        data: {
                            taskType: task.type,
                            taskPayload: task.payload as any || {},
                            status: outcome.action.status,
                            result: outcome.action.detail ? { detail: outcome.action.detail } : null,
                            error: outcome.action.status === "failed" ? outcome.action.detail : null,
                            duration,
                            traceId,
                            // Optional fields that may not be present on all tasks
                            intent: (task as unknown as { intent?: string })?.intent || null,
                            confidence: (task as unknown as { confidence?: number })?.confidence || null,
                        }
                    });

                    logger.info(
                        { taskId: task.id, taskType: task.type },
                        "✅ TaskExecution audit record created"
                    );
                } catch (dbError) {
                    logger.error(
                        { taskId: task.id, error: dbError },
                        "Failed to create TaskExecution audit record"
                    );
                    // Non-blocking - continue execution even if audit logging fails
                }

                // 🧠 REFLECTION: Evaluate execution and attempt correction if needed
                const evaluation = reflector.evaluate(task, outcome.action);

                if (evaluation.needsRetry && evaluation.corrections.length > 0) {
                    const bestCorrection = reflector.getBestCorrection(evaluation);

                    if (bestCorrection) {
                        const correctedTask = reflector.applyCorrection(task, bestCorrection);

                        if (correctedTask) {
                            logger.info(
                                {
                                    originalTask: task.type,
                                    correction: bestCorrection.type,
                                    reason: bestCorrection.reason,
                                },
                                "🔄 Applying correction and retrying task"
                            );

                            tracer.recordStep(traceId, {
                                name: `retry_${task.type}`,
                                status: "running",
                                metadata: {
                                    taskId: task.id,
                                    correctionType: bestCorrection.type,
                                    reason: bestCorrection.reason,
                                },
                            });

                            // Retry with corrected task
                            const retryStart = Date.now();
                            outcome = await this.runTask(correctedTask);
                            const retryDuration = Date.now() - retryStart;

                            // Log retry attempt to database
                            try {
                                await prisma.taskExecution.create({
                                    data: {
                                        taskType: `${task.type}_retry`,
                                        taskPayload: correctedTask.payload as any || {},
                                        status: outcome.action.status,
                                        result: outcome.action.detail ? { detail: outcome.action.detail } : null,
                                        error: outcome.action.status === "failed" ? outcome.action.detail : null,
                                        duration: retryDuration,
                                        traceId,
                                        correctionType: bestCorrection.type,
                                        // Optional fields that may not be present on all tasks
                                        intent: (task as unknown as { intent?: string })?.intent || null,
                                        confidence: (task as unknown as { confidence?: number })?.confidence || null,
                                    }
                                });
                            } catch (retryDbError) {
                                logger.error(
                                    { taskId: task.id, error: retryDbError },
                                    "Failed to create retry TaskExecution record"
                                );
                            }

                            tracer.recordToolCall(traceId, {
                                tool: `${task.type}_retry`,
                                input: { correctedPayload: correctedTask.payload },
                                output: { status: outcome.action.status, detail: outcome.action.detail },
                                duration: retryDuration,
                                status: outcome.action.status === "success" ? "success" : "failed",
                                error: outcome.action.status === "failed" ? outcome.action.detail : undefined,
                            });
                        }
                    }
                }

                actions.push(outcome.action);

                tracer.completeStep(
                    traceId,
                    `execute_${task.type}`,
                    outcome.action.status === "success" ? "success" : "failed",
                    outcome.action.status === "failed" ? outcome.action.detail : undefined
                );

                // Record as tool call
                tracer.recordToolCall(traceId, {
                    tool: task.type,
                    input: { payload: task.payload },
                    output: { status: outcome.action.status, detail: outcome.action.detail },
                    duration,
                    status: outcome.action.status === "success" ? "success" : "failed",
                    error: outcome.action.status === "failed" ? outcome.action.detail : undefined,
                });

                if (outcome.stop) {
                    break;
                }
            }

            tracer.endTrace(traceId, "completed");

            logger.info({ traceId }, "Plan execution completed successfully");

            return {
                summary: buildSummary(actions),
                actions,
            };
        } catch (error) {
            tracer.endTrace(traceId, "failed", (error as Error).message);
            logger.error({ traceId, err: error }, "Plan execution failed");
            throw error;
        }
    }

    private async runTask(task: PlannedTask): Promise<TaskOutcome> {
        // Try legacy handlers first (backward compatibility)
        const handler = this.handlers[task.type];
        if (handler) {
            try {
                const action = await handler(task);
                return { action, stop: false };
            } catch (error) {
                logger.error({ task, err: error }, "Legacy handler execution failed");
                return {
                    action: {
                        taskId: task.id,
                        provider: task.provider,
                        status: "failed",
                        detail: `Fejl: ${String((error as Error).message ?? error)}`,
                    },
                    stop: task.blocking,
                } satisfies TaskOutcome;
            }
        }

        // If Tool Registry is enabled, try dynamic tool lookup
        if (this.useToolRegistry) {
            return await this.runTaskWithToolRegistry(task);
        }

        // No handler found and tool registry not enabled
        return { action: handleUnknown(task), stop: false };
    }

    /**
     * Execute task using Tool Registry (ADK pattern)
     * 
     * Dynamically looks up tool by name and executes with proper context
     */
    private async runTaskWithToolRegistry(task: PlannedTask): Promise<TaskOutcome> {
        try {
            // Dynamic import to avoid circular dependencies
            const { toolRegistry, createToolContext } = await import("../tools");

            // Create tool context from task
            const context = createToolContext({
                session_id: task.id,
                app_name: "renos",
            });

            // Execute tool
            const result = await toolRegistry.executeTool(
                task.type,
                task.payload || {},
                context
            );

            // Convert tool result to ExecutionAction
            const action: ExecutionAction = {
                taskId: task.id,
                provider: task.provider,
                status: result.status === "success" ? "success" : "failed",
                detail: result.message as string || JSON.stringify(result),
            };

            logger.info(
                { taskType: task.type, toolStatus: result.status },
                "Task executed via Tool Registry"
            );

            return { action, stop: false };
        } catch (error) {
            logger.error({ task, err: error }, "Tool Registry execution failed");
            return {
                action: {
                    taskId: task.id,
                    provider: task.provider,
                    status: "failed",
                    detail: `Tool Registry fejl: ${String((error as Error).message ?? error)}`,
                },
                stop: task.blocking,
            } satisfies TaskOutcome;
        }
    }
}

function handleUnknown(task: PlannedTask): ExecutionAction {
    logger.debug({ task }, "No executor for task; skipping");
    return {
        taskId: task.id,
        provider: task.provider,
        status: "skipped",
        detail: `Ingen eksekvering implementeret for ${task.type}`,
    } satisfies ExecutionAction;
}

function buildSummary(actions: ExecutionAction[]): string {
    // Return single action detail directly for analytics/queries
    if (shouldReturnSingleActionDetail(actions)) {
        return actions[0].detail;
    }

    // Combine multiple detailed actions
    if (hasMultipleDetailedActions(actions)) {
        return combineActionDetails(actions);
    }

    // Fallback to generic summary
    return buildGenericSummary(actions);
}

function shouldReturnSingleActionDetail(actions: ExecutionAction[]): boolean {
    return actions.length === 1 &&
        actions[0].status === "success" &&
        Boolean(actions[0].detail);
}

function hasMultipleDetailedActions(actions: ExecutionAction[]): boolean {
    return actions.length > 0 &&
        actions.some(a => a.detail && a.detail.length > 50);
}

function combineActionDetails(actions: ExecutionAction[]): string {
    return actions
        .filter(a => a.status === "success" && a.detail)
        .map(a => a.detail)
        .join("\n\n");
}

function buildGenericSummary(actions: ExecutionAction[]): string {
    const success = actions.filter((action) => action.status === "success").length;
    const queued = actions.filter((action) => action.status === "queued").length;
    const failed = actions.filter((action) => action.status === "failed").length;

    return `Plan eksekveret: ${success} succes, ${queued} i kø, ${failed} fejlede.`;
}