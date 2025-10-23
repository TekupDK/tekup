/**
 * Audit Logger Middleware for MCP Tools
 * Wraps MCP tool execution with audit logging to Supabase
 * Tracks: tool calls, success/failure, duration, organization context
 */

import { log as logger } from '../utils/logger.js';
import { logAuditEvent } from '../database/supabase-client.js';

/**
 * Audit log entry metadata for tool execution
 */
interface ToolExecutionContext {
    toolName: string;
    action: string;
    organizationId: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Wraps an MCP tool function with audit logging
 * 
 * Usage:
 * ```typescript
 * const wrappedTool = withAuditLogging(
 *   'list_invoices',
 *   'read',
 *   organizationId,
 *   async (args) => {
 *     // Tool logic here
 *     return result;
 *   }
 * );
 * ```
 * 
 * @param toolName - Name of the MCP tool being executed
 * @param action - Action type (read, create, update, delete)
 * @param organizationId - Organization ID for context
 * @param toolFunction - The actual tool function to execute
 * @param userId - Optional user ID
 * @param ipAddress - Optional IP address
 * @param userAgent - Optional user agent string
 * @returns Wrapped function that logs execution to audit table
 */
export function withAuditLogging<TArgs, TResult>(
    toolName: string,
    action: 'read' | 'create' | 'update' | 'delete',
    organizationId: string,
    toolFunction: (args: TArgs) => Promise<TResult>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
): (args: TArgs) => Promise<TResult> {
    return async (args: TArgs): Promise<TResult> => {
        const startTime = Date.now();
        let success = false;
        let errorMessage: string | undefined;
        let result: TResult | undefined;

        try {
            // Execute the tool function
            result = await toolFunction(args);
            success = true;
            return result;
        } catch (error) {
            // Capture error for audit log
            success = false;
            errorMessage = error instanceof Error ? error.message : String(error);
            throw error; // Re-throw to maintain error handling flow
        } finally {
            // Log to audit table (fire and forget - don't block tool execution)
            const durationMs = Date.now() - startTime;

            // Prepare input/output params (truncate if needed)
            let inputParams: Record<string, any> | undefined;
            let outputData: Record<string, any> | undefined;

            try {
                inputParams = typeof args === 'object' && args !== null
                    ? JSON.parse(JSON.stringify(args))
                    : { value: args };
            } catch {
                inputParams = undefined;
            }

            try {
                if (success && result !== undefined) {
                    outputData = typeof result === 'object' && result !== null
                        ? JSON.parse(JSON.stringify(result))
                        : { value: result };
                }
            } catch {
                outputData = undefined;
            }

            // Log audit event asynchronously
            logAuditEvent({
                organization_id: organizationId,
                user_id: userId,
                tool_name: toolName,
                action,
                success,
                duration_ms: durationMs,
                input_params: inputParams,
                output_data: outputData,
                error_message: errorMessage,
                ip_address: ipAddress,
                user_agent: userAgent,
            }).catch((auditError) => {
                // Log audit failures but don't throw
                logger.error(`Audit log failed for ${toolName}`, auditError instanceof Error ? auditError : new Error(String(auditError)));
            });
        }
    };
}

/**
 * Creates an audit logging wrapper with pre-configured context
 * 
 * Usage:
 * ```typescript
 * const auditor = createAuditor(organizationId, userId, ipAddress, userAgent);
 * 
 * const wrappedTool = auditor.wrap(
 *   'list_invoices',
 *   'read',
 *   async (args) => {
 *     // Tool logic
 *     return result;
 *   }
 * );
 * ```
 */
export class AuditLogger {
    private organizationId: string;
    private userId?: string;
    private ipAddress?: string;
    private userAgent?: string;

    constructor(
        organizationId: string,
        userId?: string,
        ipAddress?: string,
        userAgent?: string
    ) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    /**
     * Wraps a tool function with audit logging using pre-configured context
     */
    wrap<TArgs, TResult>(
        toolName: string,
        action: 'read' | 'create' | 'update' | 'delete',
        toolFunction: (args: TArgs) => Promise<TResult>
    ): (args: TArgs) => Promise<TResult> {
        return withAuditLogging(
            toolName,
            action,
            this.organizationId,
            toolFunction,
            this.userId,
            this.ipAddress,
            this.userAgent
        );
    }

    /**
     * Manually log an audit event without wrapping a function
     */
    async logEvent(
        toolName: string,
        action: 'read' | 'create' | 'update' | 'delete',
        success: boolean,
        durationMs: number,
        inputParams?: Record<string, any>,
        outputData?: Record<string, any>,
        errorMessage?: string
    ): Promise<void> {
        await logAuditEvent({
            organization_id: this.organizationId,
            user_id: this.userId,
            tool_name: toolName,
            action,
            success,
            duration_ms: durationMs,
            input_params: inputParams,
            output_data: outputData,
            error_message: errorMessage,
            ip_address: this.ipAddress,
            user_agent: this.userAgent,
        });
    }
}

/**
 * Factory function to create an AuditLogger instance
 */
export function createAuditor(
    organizationId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
): AuditLogger {
    return new AuditLogger(organizationId, userId, ipAddress, userAgent);
}
