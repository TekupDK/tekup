/**
 * Tool Context for ADK-style Tools
 * 
 * Provides tools with access to:
 * - Session state (read/write)
 * - Event actions (control agent flow)
 * - Authentication context
 * - Artifacts and memory services
 * 
 * Based on Google ADK ToolContext pattern
 */

export interface EventActions {
    /**
     * Skip LLM summarization step after tool execution.
     * Use when tool returns user-ready message.
     */
    skip_summarization: boolean;

    /**
     * Transfer control to another agent.
     * Set to agent name to trigger transfer.
     */
    transfer_to_agent?: string;

    /**
     * Escalate to parent agent.
     * Signals that current agent cannot handle request.
     */
    escalate: boolean;
}

export interface ToolContext {
    /**
     * Session state - read/write access
     * 
     * Prefixes:
     * - app:* = Shared across all users
     * - user:* = User-specific across sessions
     * - (no prefix) = Session-specific
     * - temp:* = Temporary, not persisted
     */
    state: Record<string, any>;

    /**
     * Control agent behavior after tool execution
     */
    actions: EventActions;

    /**
     * Unique identifier for this tool invocation
     */
    function_call_id: string;

    /**
     * Event that triggered this tool call
     */
    function_call_event_id: string;

    /**
     * Authentication response/credentials (if auth flow completed)
     */
    auth_response?: any;

    /**
     * Current session ID
     */
    session_id?: string;

    /**
     * Current user ID
     */
    user_id?: string;

    /**
     * Application name
     */
    app_name?: string;
}

/**
 * Create a new ToolContext instance
 */
export function createToolContext(options: {
    state?: Record<string, any>;
    session_id?: string;
    user_id?: string;
    app_name?: string;
    function_call_id?: string;
    function_call_event_id?: string;
}): ToolContext {
    return {
        state: options.state || {},
        actions: {
            skip_summarization: false,
            escalate: false,
        },
        function_call_id: options.function_call_id || generateId(),
        function_call_event_id: options.function_call_event_id || generateId(),
        session_id: options.session_id,
        user_id: options.user_id,
        app_name: options.app_name || "renos",
    };
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
