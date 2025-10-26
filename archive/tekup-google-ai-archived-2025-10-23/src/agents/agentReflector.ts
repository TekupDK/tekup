/**
 * Agent Reflection System
 * 
 * Enables agents to evaluate their own performance and suggest corrections.
 * This implements a "self-evaluation → correction → retry" pattern.
 * 
 * Quick Win #3 from Agent Architecture Audit
 */

import { logger } from "../logger";
import type { PlannedTask, ExecutionResult } from "../types";

// Type for individual execution actions
type ExecutionAction = ExecutionResult["actions"][number];

// ============================================================================
// Types
// ============================================================================

/**
 * Evaluation result from reflecting on a task execution
 */
export interface TaskEvaluation {
  /** Unique evaluation ID */
  id: string;
  /** Task that was evaluated */
  taskType: string;
  /** Execution status */
  executionStatus: "success" | "failed" | "queued" | "skipped";
  /** Whether the task needs to be retried */
  needsRetry: boolean;
  /** Confidence score in the evaluation (0-1) */
  confidence: number;
  /** Issues identified */
  issues: EvaluationIssue[];
  /** Suggested corrections */
  corrections: SuggestedCorrection[];
  /** Timestamp */
  evaluatedAt: Date;
}

/**
 * Issue identified during evaluation
 */
export interface EvaluationIssue {
  /** Issue severity */
  severity: "low" | "medium" | "high" | "critical";
  /** Issue category */
  category:
  | "missing_data"
  | "invalid_format"
  | "api_error"
  | "timeout"
  | "logic_error"
  | "user_error"
  | "unknown";
  /** Issue description */
  description: string;
  /** Affected field or component */
  affectedField?: string;
}

/**
 * Suggested correction for an issue
 */
export interface SuggestedCorrection {
  /** Correction type */
  type: "retry" | "modify_task" | "skip" | "escalate";
  /** Correction description */
  description: string;
  /** Modified task (if type is modify_task) */
  modifiedTask?: Partial<PlannedTask>;
  /** Reason for the correction */
  reason: string;
}

/**
 * Reflection metrics
 */
export interface ReflectionMetrics {
  /** Total evaluations performed */
  totalEvaluations: number;
  /** Total retries suggested */
  totalRetries: number;
  /** Total corrections applied */
  totalCorrections: number;
  /** Success rate after corrections (0-1) */
  correctionSuccessRate: number;
  /** Average confidence score */
  averageConfidence: number;
}

// ============================================================================
// Agent Reflector
// ============================================================================

/**
 * Agent Reflector - Evaluates task execution and suggests corrections
 * 
 * This enables the agent to:
 * 1. Evaluate whether a task succeeded or failed
 * 2. Identify specific issues in failed tasks
 * 3. Suggest corrections (retry, modify, skip, escalate)
 * 4. Learn from past corrections
 */
export class AgentReflector {
  private evaluations = new Map<string, TaskEvaluation>();
  private metrics: ReflectionMetrics = {
    totalEvaluations: 0,
    totalRetries: 0,
    totalCorrections: 0,
    correctionSuccessRate: 0,
    averageConfidence: 0,
  };

  /**
   * Evaluate a task execution
   */
  evaluate(task: PlannedTask, result: ExecutionAction): TaskEvaluation {
    const evaluation: TaskEvaluation = {
      id: this.generateEvaluationId(),
      taskType: task.type,
      executionStatus: result.status,
      needsRetry: false,
      confidence: 0.8,
      issues: [],
      corrections: [],
      evaluatedAt: new Date(),
    };

    // Analyze execution result
    if (result.status === "failed") {
      evaluation.needsRetry = true;
      evaluation.issues = this.identifyIssues(task, result);
      evaluation.corrections = this.suggestCorrections(task, evaluation.issues);

      // Lower confidence if many issues
      if (evaluation.issues.length > 2) {
        evaluation.confidence = 0.6;
      }
    } else if (result.status === "success") {
      // Even successful tasks can have issues (e.g., warnings)
      evaluation.issues = this.identifyIssues(task, result);

      if (evaluation.issues.length > 0) {
        evaluation.needsRetry = false; // Success but with warnings
        evaluation.corrections = this.suggestCorrections(task, evaluation.issues);
      }
    }

    // Store evaluation
    this.evaluations.set(evaluation.id, evaluation);
    this.updateMetrics(evaluation);

    logger.info(
      {
        evaluationId: evaluation.id,
        taskType: task.type,
        status: result.status,
        needsRetry: evaluation.needsRetry,
        issuesFound: evaluation.issues.length,
        correctionsProvided: evaluation.corrections.length,
      },
      "Task evaluation complete"
    );

    return evaluation;
  }

  /**
   * Identify issues in task execution
   */
  private identifyIssues(
    task: PlannedTask,
    result: ExecutionAction
  ): EvaluationIssue[] {
    const issues: EvaluationIssue[] = [];

    // Check for missing data
    if (result.status === "failed" && result.detail?.includes("missing")) {
      issues.push({
        severity: "high",
        category: "missing_data",
        description: "Required data is missing",
        affectedField: this.extractFieldFromError(result.detail),
      });
    }

    // Check for API errors
    if (result.detail?.includes("API") || result.detail?.includes("error")) {
      issues.push({
        severity: "medium",
        category: "api_error",
        description: result.detail || "API error occurred",
      });
    }

    // Check for timeout
    if (result.detail?.includes("timeout") || result.detail?.includes("timed out")) {
      issues.push({
        severity: "medium",
        category: "timeout",
        description: "Operation timed out",
      });
    }

    // Check for invalid format
    if (result.detail?.includes("invalid") || result.detail?.includes("format")) {
      issues.push({
        severity: "high",
        category: "invalid_format",
        description: "Invalid data format detected",
        affectedField: this.extractFieldFromError(result.detail),
      });
    }

    // Task-specific checks
    switch (task.type) {
      case "email.compose":
        if (!task.payload.to || !task.payload.subject || !task.payload.body) {
          issues.push({
            severity: "critical",
            category: "missing_data",
            description: "Email missing required fields (to, subject, or body)",
            affectedField: !task.payload.to ? "to" : !task.payload.subject ? "subject" : "body",
          });
        }
        break;

      case "calendar.book":
        if (!task.payload.startTime || !task.payload.endTime) {
          issues.push({
            severity: "critical",
            category: "missing_data",
            description: "Booking missing required time fields",
            affectedField: !task.payload.startTime ? "startTime" : "endTime",
          });
        }
        break;
    }

    return issues;
  }

  /**
   * Suggest corrections based on identified issues
   */
  private suggestCorrections(
    task: PlannedTask,
    issues: EvaluationIssue[]
  ): SuggestedCorrection[] {
    const corrections: SuggestedCorrection[] = [];

    for (const issue of issues) {
      switch (issue.category) {
        case "missing_data":
          if (issue.severity === "critical") {
            corrections.push({
              type: "escalate",
              description: "Escalate to human - critical data missing",
              reason: `Cannot proceed without ${issue.affectedField}`,
            });
          } else {
            corrections.push({
              type: "retry",
              description: "Retry with data gathering step",
              reason: "Attempt to gather missing data from context",
            });
          }
          break;

        case "api_error":
          corrections.push({
            type: "retry",
            description: "Retry with exponential backoff",
            reason: "Transient API errors can be resolved with retry",
          });
          break;

        case "timeout":
          corrections.push({
            type: "modify_task",
            description: "Increase timeout and retry",
            modifiedTask: {
              ...task,
              payload: {
                ...task.payload,
                timeout: ((task.payload.timeout as number) || 30000) * 2,
              },
            },
            reason: "Operation needs more time",
          });
          break;

        case "invalid_format":
          if (issue.affectedField) {
            corrections.push({
              type: "modify_task",
              description: `Reformat ${issue.affectedField} and retry`,
              modifiedTask: {
                ...task,
                payload: this.attemptFormatFix(task.payload, issue.affectedField),
              },
              reason: "Data format can be corrected",
            });
          }
          break;

        case "logic_error":
        case "user_error":
          corrections.push({
            type: "escalate",
            description: "Escalate to human - logic or user error",
            reason: "Requires human judgment",
          });
          break;

        default:
          corrections.push({
            type: "retry",
            description: "Generic retry",
            reason: "Unknown issue, attempting retry",
          });
      }
    }

    return corrections;
  }

  /**
   * Get the best correction suggestion
   */
  getBestCorrection(evaluation: TaskEvaluation): SuggestedCorrection | null {
    if (evaluation.corrections.length === 0) {
      return null;
    }

    // Priority order: modify_task > retry > skip > escalate
    const priority = { modify_task: 1, retry: 2, skip: 3, escalate: 4 };

    return evaluation.corrections.sort((a, b) => {
      return (priority[a.type] || 99) - (priority[b.type] || 99);
    })[0];
  }

  /**
   * Apply a correction and create a new task
   */
  applyCorrection(
    original: PlannedTask,
    correction: SuggestedCorrection
  ): PlannedTask | null {
    switch (correction.type) {
      case "modify_task":
        if (correction.modifiedTask) {
          logger.info(
            { taskType: original.type, correction: correction.description },
            "Applying task modification"
          );
          return {
            ...original,
            ...correction.modifiedTask,
          } as PlannedTask;
        }
        return null;

      case "retry":
        logger.info(
          { taskType: original.type, correction: correction.description },
          "Retrying task"
        );
        return original;

      case "skip":
        logger.info(
          { taskType: original.type, correction: correction.description },
          "Skipping task"
        );
        return null;

      case "escalate":
        logger.warn(
          { taskType: original.type, correction: correction.description },
          "Escalating task to human"
        );
        // Future: Create escalation ticket
        return null;

      default:
        return null;
    }
  }

  /**
   * Get reflection metrics
   */
  getMetrics(): ReflectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get evaluation history
   */
  getEvaluations(limit = 10): TaskEvaluation[] {
    return Array.from(this.evaluations.values())
      .sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old evaluations (keep last 100)
   */
  cleanup(maxEvaluations = 100): number {
    const evaluations = Array.from(this.evaluations.values()).sort(
      (a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime()
    );

    if (evaluations.length <= maxEvaluations) {
      return 0;
    }

    const toRemove = evaluations.slice(maxEvaluations);
    for (const evaluation of toRemove) {
      this.evaluations.delete(evaluation.id);
    }

    logger.debug(
      { removed: toRemove.length, remaining: maxEvaluations },
      "Cleaned up old evaluations"
    );

    return toRemove.length;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private generateEvaluationId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractFieldFromError(message?: string): string | undefined {
    if (!message) return undefined;

    // Try to extract field name from error messages like "missing email" or "invalid phone"
    const match = message.match(/(?:missing|invalid|required)\s+(\w+)/i);
    return match?.[1];
  }

  private attemptFormatFix(
    payload: Record<string, unknown>,
    field: string
  ): Record<string, unknown> {
    const newPayload = { ...payload };
    const value = payload[field];

    // Simple format fixes
    if (typeof value === "string") {
      // Trim whitespace
      newPayload[field] = value.trim();

      // Fix email format
      if (field.toLowerCase().includes("email")) {
        newPayload[field] = value.toLowerCase().trim();
      }

      // Fix phone format (remove spaces, dashes)
      if (field.toLowerCase().includes("phone")) {
        newPayload[field] = value.replace(/[\s-]/g, "");
      }
    }

    return newPayload;
  }

  private updateMetrics(evaluation: TaskEvaluation): void {
    this.metrics.totalEvaluations++;

    if (evaluation.needsRetry) {
      this.metrics.totalRetries++;
    }

    if (evaluation.corrections.length > 0) {
      this.metrics.totalCorrections++;
    }

    // Update average confidence
    const allEvaluations = Array.from(this.evaluations.values());
    this.metrics.averageConfidence =
      allEvaluations.reduce((sum, e) => sum + e.confidence, 0) / allEvaluations.length;

    // Calculate correction success rate
    // (successful corrections / total corrections)
    const successfulCorrections = allEvaluations.filter(
      (e) => e.executionStatus === "success" && e.corrections.length > 0
    ).length;
    this.metrics.correctionSuccessRate =
      this.metrics.totalCorrections > 0
        ? successfulCorrections / this.metrics.totalCorrections
        : 0;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const reflector = new AgentReflector();
