/**
 * Execution Tracer - Observability for RenOS Agent System
 * 
 * Tracks agent execution with detailed metrics:
 * - Task execution steps
 * - LLM API calls
 * - Tool invocations
 * - Performance metrics
 * - Error tracking
 * 
 * Usage:
 * ```typescript
 * const tracer = new ExecutionTracer();
 * const trace = tracer.startTrace('task-123');
 * 
 * // During execution
 * trace.recordStep({ name: 'parse_intent', status: 'success' });
 * trace.recordLLMCall({ model: 'gemini-2.0-flash', tokens: 150 });
 * trace.recordToolCall({ tool: 'calendar.book', duration: 450 });
 * 
 * // At the end
 * const summary = tracer.getTrace('task-123');
 * await tracer.exportTrace('task-123');
 * ```
 */

import { logger } from "../logger";

export interface ExecutionStep {
    name: string;
    status: "pending" | "running" | "success" | "failed";
    startTime: Date;
    endTime?: Date;
    duration?: number; // milliseconds
    metadata?: Record<string, unknown>;
    error?: string;
}

export interface LLMCall {
    model: string;
    prompt?: string;
    response?: string;
    tokensUsed: number;
    tokensPrompt?: number;
    tokensCompletion?: number;
    duration: number; // milliseconds
    cost?: number; // USD
    timestamp: Date;
}

export interface ToolCall {
    tool: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    duration: number; // milliseconds
    status: "success" | "failed";
    error?: string;
    timestamp: Date;
}

export interface ExecutionMetrics {
    totalDuration: number; // milliseconds
    llmTokensUsed: number;
    llmCallsCount: number;
    llmTotalCost: number; // USD
    toolCallsCount: number;
    toolSuccessRate: number; // percentage
    stepsCompleted: number;
    stepsFailed: number;
}

export interface ExecutionTrace {
    traceId: string;
    taskId?: string;
    taskType?: string;
    startTime: Date;
    endTime?: Date;
    status: "running" | "completed" | "failed";
    steps: ExecutionStep[];
    llmCalls: LLMCall[];
    toolCalls: ToolCall[];
    metrics: ExecutionMetrics;
    error?: string;
}

export class ExecutionTracer {
    private traces = new Map<string, ExecutionTrace>();
    private currentTraceId: string | null = null;

    /**
     * Start a new execution trace
     */
    startTrace(taskId: string, taskType?: string): string {
        const traceId = this.generateTraceId();

        const trace: ExecutionTrace = {
            traceId,
            taskId,
            taskType,
            startTime: new Date(),
            status: "running",
            steps: [],
            llmCalls: [],
            toolCalls: [],
            metrics: {
                totalDuration: 0,
                llmTokensUsed: 0,
                llmCallsCount: 0,
                llmTotalCost: 0,
                toolCallsCount: 0,
                toolSuccessRate: 100,
                stepsCompleted: 0,
                stepsFailed: 0,
            },
        };

        this.traces.set(traceId, trace);
        this.currentTraceId = traceId;

        logger.debug({ traceId, taskId, taskType }, "Execution trace started");

        return traceId;
    }

    /**
     * Record an execution step
     */
    recordStep(
        traceId: string,
        step: Omit<ExecutionStep, "startTime" | "duration">
    ): void {
        const trace = this.traces.get(traceId);
        if (!trace) {
            logger.warn({ traceId }, "Trace not found");
            return;
        }

        const fullStep: ExecutionStep = {
            ...step,
            startTime: new Date(),
        };

        if (step.endTime) {
            fullStep.duration = step.endTime.getTime() - fullStep.startTime.getTime();
        }

        trace.steps.push(fullStep);

        // Update metrics
        if (step.status === "success") {
            trace.metrics.stepsCompleted++;
        } else if (step.status === "failed") {
            trace.metrics.stepsFailed++;
        }

        logger.debug({ traceId, step: step.name, status: step.status }, "Step recorded");
    }

    /**
     * Complete an existing step (set endTime and duration)
     */
    completeStep(traceId: string, stepName: string, status: "success" | "failed", error?: string): void {
        const trace = this.traces.get(traceId);
        if (!trace) return;

        const step = trace.steps.find(s => s.name === stepName && !s.endTime);
        if (!step) return;

        step.endTime = new Date();
        step.duration = step.endTime.getTime() - step.startTime.getTime();
        step.status = status;
        if (error) step.error = error;

        // Update metrics
        if (status === "success") {
            trace.metrics.stepsCompleted++;
        } else {
            trace.metrics.stepsFailed++;
        }
    }

    /**
     * Record an LLM API call
     */
    recordLLMCall(traceId: string, call: Omit<LLMCall, "timestamp">): void {
        const trace = this.traces.get(traceId);
        if (!trace) {
            logger.warn({ traceId }, "Trace not found");
            return;
        }

        const fullCall: LLMCall = {
            ...call,
            timestamp: new Date(),
        };

        trace.llmCalls.push(fullCall);

        // Update metrics
        trace.metrics.llmTokensUsed += call.tokensUsed;
        trace.metrics.llmCallsCount++;
        if (call.cost) {
            trace.metrics.llmTotalCost += call.cost;
        }

        logger.debug({
            traceId,
            model: call.model,
            tokens: call.tokensUsed,
            duration: call.duration,
        }, "LLM call recorded");
    }

    /**
     * Record a tool invocation
     */
    recordToolCall(traceId: string, call: Omit<ToolCall, "timestamp">): void {
        const trace = this.traces.get(traceId);
        if (!trace) {
            logger.warn({ traceId }, "Trace not found");
            return;
        }

        const fullCall: ToolCall = {
            ...call,
            timestamp: new Date(),
        };

        trace.toolCalls.push(fullCall);

        // Update metrics
        trace.metrics.toolCallsCount++;

        const successfulCalls = trace.toolCalls.filter(c => c.status === "success").length;
        trace.metrics.toolSuccessRate = (successfulCalls / trace.toolCalls.length) * 100;

        logger.debug({
            traceId,
            tool: call.tool,
            status: call.status,
            duration: call.duration,
        }, "Tool call recorded");
    }

    /**
     * End an execution trace
     */
    endTrace(traceId: string, status: "completed" | "failed", error?: string): void {
        const trace = this.traces.get(traceId);
        if (!trace) {
            logger.warn({ traceId }, "Trace not found");
            return;
        }

        trace.endTime = new Date();
        trace.status = status;
        trace.metrics.totalDuration = trace.endTime.getTime() - trace.startTime.getTime();

        if (error) {
            trace.error = error;
        }

        logger.info({
            traceId,
            taskId: trace.taskId,
            status,
            duration: trace.metrics.totalDuration,
            steps: trace.steps.length,
            llmCalls: trace.llmCalls.length,
            toolCalls: trace.toolCalls.length,
        }, "Execution trace completed");

        if (this.currentTraceId === traceId) {
            this.currentTraceId = null;
        }
    }

    /**
     * Get a trace by ID
     */
    getTrace(traceId: string): ExecutionTrace | undefined {
        return this.traces.get(traceId);
    }

    /**
     * Get current active trace
     */
    getCurrentTrace(): ExecutionTrace | undefined {
        if (!this.currentTraceId) return undefined;
        return this.traces.get(this.currentTraceId);
    }

    /**
     * Get all traces
     */
    getAllTraces(): ExecutionTrace[] {
        return Array.from(this.traces.values());
    }

    /**
     * Export trace as JSON string
     */
    exportTrace(traceId: string): string {
        const trace = this.traces.get(traceId);
        if (!trace) {
            throw new Error(`Trace not found: ${traceId}`);
        }

        return JSON.stringify(
            {
                ...trace,
                duration: trace.endTime
                    ? trace.endTime.getTime() - trace.startTime.getTime()
                    : Date.now() - trace.startTime.getTime(),
            },
            null,
            2
        );
    }

    /**
     * Get trace summary (for display)
     */
    getTraceSummary(traceId: string): string {
        const trace = this.traces.get(traceId);
        if (!trace) return "Trace not found";

        const duration = trace.endTime
            ? trace.endTime.getTime() - trace.startTime.getTime()
            : Date.now() - trace.startTime.getTime();

        return `
╔═══════════════════════════════════════════════════════════════════╗
║                      EXECUTION TRACE SUMMARY                      ║
╚═══════════════════════════════════════════════════════════════════╝

Trace ID:      ${trace.traceId}
Task ID:       ${trace.taskId || "N/A"}
Task Type:     ${trace.taskType || "N/A"}
Status:        ${trace.status.toUpperCase()}
Duration:      ${duration}ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METRICS:
  Steps:        ${trace.metrics.stepsCompleted} completed, ${trace.metrics.stepsFailed} failed
  LLM Calls:    ${trace.metrics.llmCallsCount} calls, ${trace.metrics.llmTokensUsed} tokens
  LLM Cost:     $${trace.metrics.llmTotalCost.toFixed(4)}
  Tool Calls:   ${trace.metrics.toolCallsCount} calls, ${trace.metrics.toolSuccessRate.toFixed(1)}% success

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEPS (${trace.steps.length}):
${trace.steps
                .map(
                    (s, i) =>
                        `  ${i + 1}. ${s.name.padEnd(30)} [${s.status.toUpperCase()}] ${s.duration ? `${s.duration}ms` : "..."
                        }`
                )
                .join("\n")}

LLM CALLS (${trace.llmCalls.length}):
${trace.llmCalls
                .map(
                    (c, i) =>
                        `  ${i + 1}. ${c.model.padEnd(25)} ${c.tokensUsed} tokens, ${c.duration}ms`
                )
                .join("\n")}

TOOL CALLS (${trace.toolCalls.length}):
${trace.toolCalls
                .map(
                    (c, i) =>
                        `  ${i + 1}. ${c.tool.padEnd(25)} [${c.status.toUpperCase()}] ${c.duration}ms`
                )
                .join("\n")}

${trace.error ? `\n⚠️  ERROR: ${trace.error}\n` : ""}
═══════════════════════════════════════════════════════════════════
`;
    }

    /**
     * Clear old traces (keep last 100)
     */
    cleanup(maxTraces = 100): number {
        if (this.traces.size <= maxTraces) return 0;

        const traces = Array.from(this.traces.entries());
        traces.sort((a, b) => b[1].startTime.getTime() - a[1].startTime.getTime());

        const toDelete = traces.slice(maxTraces);
        toDelete.forEach(([traceId]) => this.traces.delete(traceId));

        logger.info({ deleted: toDelete.length }, "Cleaned up old traces");
        return toDelete.length;
    }

    /**
     * Generate unique trace ID
     */
    private generateTraceId(): string {
        return `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
}

// Singleton instance
export const tracer = new ExecutionTracer();
