import { randomUUID } from "crypto";

/**
 * Action Audit Logger
 *
 * Purpose: Track all action lifecycle events for security, debugging, and analytics
 * - Shown: When suggestion is displayed to user
 * - Approved: When user approves action
 * - Rejected: When user rejects action
 * - Dry Run: When dry run is executed
 * - Executed: When action is actually executed
 * - Failed: When execution fails
 */

export type ActionEventType =
  | "shown"
  | "approved"
  | "rejected"
  | "dry_run_success"
  | "dry_run_failed"
  | "executed"
  | "failed";

export interface ActionAuditEvent {
  eventId: string;
  eventType: ActionEventType;
  actionType: string;
  actionId: string;
  conversationId?: number;
  userId: number;
  correlationId: string;
  timestamp: Date;
  params?: Record<string, any>;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate a correlation ID for tracking actions across their lifecycle
 */
export function generateCorrelationId(): string {
  return `action_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

/**
 * Log action audit event
 */
export async function logActionEvent(
  event: Omit<ActionAuditEvent, "eventId" | "timestamp">
): Promise<void> {
  const auditEvent: ActionAuditEvent = {
    eventId: randomUUID(),
    timestamp: new Date(),
    ...event,
  };

  // Log to console (structured logging via Pino)
  console.log({
    level: "info",
    msg: "[Action Audit]",
    ...auditEvent,
    // Redact sensitive data
    params: redactSensitiveData(auditEvent.params),
  });

  // Store in database (if needed - can be added later)
  // For now, we use Pino logs which can be shipped to logging service
}

/**
 * Redact sensitive fields from params before logging
 */
function redactSensitiveData(
  params?: Record<string, any>
): Record<string, any> | undefined {
  if (!params) return undefined;

  const redacted = { ...params };
  const sensitiveFields = [
    "password",
    "apiKey",
    "token",
    "secret",
    "creditCard",
    "ssn",
    "personalNumber",
  ];

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = "[REDACTED]";
    }
  }

  return redacted;
}

/**
 * Helper: Log when suggestion is shown to user
 */
export async function logActionShown(
  actionType: string,
  actionId: string,
  userId: number,
  correlationId: string,
  conversationId?: number,
  params?: Record<string, any>
): Promise<void> {
  await logActionEvent({
    eventType: "shown",
    actionType,
    actionId,
    userId,
    correlationId,
    conversationId,
    params,
  });
}

/**
 * Helper: Log when user approves action
 */
export async function logActionApproved(
  actionType: string,
  actionId: string,
  userId: number,
  correlationId: string,
  conversationId?: number,
  alwaysApprove?: boolean
): Promise<void> {
  await logActionEvent({
    eventType: "approved",
    actionType,
    actionId,
    userId,
    correlationId,
    conversationId,
    metadata: { alwaysApprove },
  });
}

/**
 * Helper: Log when user rejects action
 */
export async function logActionRejected(
  actionType: string,
  actionId: string,
  userId: number,
  correlationId: string,
  conversationId?: number
): Promise<void> {
  await logActionEvent({
    eventType: "rejected",
    actionType,
    actionId,
    userId,
    correlationId,
    conversationId,
  });
}

/**
 * Helper: Log dry run result
 */
export async function logActionDryRun(
  actionType: string,
  actionId: string,
  userId: number,
  correlationId: string,
  success: boolean,
  result?: any,
  error?: string,
  conversationId?: number
): Promise<void> {
  await logActionEvent({
    eventType: success ? "dry_run_success" : "dry_run_failed",
    actionType,
    actionId,
    userId,
    correlationId,
    conversationId,
    result,
    error,
  });
}

/**
 * Helper: Log successful execution
 */
export async function logActionExecuted(
  actionType: string,
  actionId: string,
  userId: number,
  correlationId: string,
  result: any,
  conversationId?: number,
  idempotencyKey?: string
): Promise<void> {
  await logActionEvent({
    eventType: "executed",
    actionType,
    actionId,
    userId,
    correlationId,
    conversationId,
    result,
    metadata: { idempotencyKey },
  });
}

/**
 * Helper: Log failed execution
 */
export async function logActionFailed(
  actionType: string,
  actionId: string,
  userId: number,
  correlationId: string,
  error: string,
  conversationId?: number,
  idempotencyKey?: string
): Promise<void> {
  await logActionEvent({
    eventType: "failed",
    actionType,
    actionId,
    userId,
    correlationId,
    conversationId,
    error,
    metadata: { idempotencyKey },
  });
}
