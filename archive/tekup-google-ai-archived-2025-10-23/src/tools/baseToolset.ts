/**
 * Base Tool Interface (ADK-inspired)
 * 
 * Represents a single capability that an agent can use.
 * Tools are modular, reusable, and can be dynamically provided to agents.
 */

import { ToolContext } from "./toolContext";

/**
 * Parameter definition for a tool
 */
export interface ToolParameter {
    type: "string" | "number" | "boolean" | "object" | "array";
    description?: string;
    required?: boolean;
    enum?: string[];
    default?: unknown;
}

/**
 * Base Tool Interface
 * 
 * A tool represents a specific capability:
 * - Querying databases
 * - Making API requests
 * - Searching the web
 * - Executing code snippets
 * - Interacting with external systems
 */
export interface BaseTool {
    /**
     * Unique tool name (use verb-noun format)
     * Examples: get_weather, parse_lead_email, create_booking
     */
    name: string;

    /**
     * Clear description of what the tool does and when to use it.
     * This is shown to the LLM for tool selection.
     */
    description: string;

    /**
     * Tool parameters (arguments the LLM must provide)
     * All parameters must be JSON-serializable types.
     */
    parameters: Record<string, ToolParameter>;

    /**
     * Execute the tool with given parameters
     * 
     * @param params - Arguments provided by LLM
     * @param context - Optional tool context (injected by framework)
     * @returns Dictionary with status and result data
     * 
     * Return value MUST be a dictionary with:
     * - status: 'success' | 'error' | 'pending'
     * - Other meaningful keys for the result
     */
    handler: (params: Record<string, unknown>, context?: ToolContext) => Promise<Record<string, unknown>>;

    /**
     * Optional: Tool category for grouping
     */
    category?: string;

    /**
     * Optional: Required permissions/scopes
     */
    required_permissions?: string[];
}

/**
 * Base Toolset (ADK pattern)
 * 
 * A toolset manages a collection of related tools.
 * It can provide tools dynamically based on context (user permissions, session state, etc.)
 */
export abstract class BaseToolset {
    /**
     * Toolset name (used for logging and organization)
     */
    abstract name: string;

    /**
     * Get tools dynamically based on context
     * 
     * This method is called by the framework when an agent needs its tools.
     * The toolset can decide which tools to expose based on:
     * - User permissions
     * - Session state
     * - Application configuration
     * 
     * @param context - Optional readonly context with session state
     * @returns List of tools to provide to the agent
     */
    abstract getTools(context?: ToolContext): Promise<BaseTool[]>;

    /**
     * Cleanup resources when toolset is no longer needed
     * 
     * Called when:
     * - Agent server is shutting down
     * - Runner is being closed
     * 
     * Use for:
     * - Closing network connections
     * - Releasing file handles
     * - Cleaning up other resources
     */
    async close(): Promise<void> {
        // Default: no cleanup needed
    }
}

/**
 * Helper: Convert BaseTool to Gemini Function Calling format
 */
export function toGeminiFunctionDeclaration(tool: BaseTool) {
    return {
        name: tool.name,
        description: tool.description,
        parameters: {
            type: "object" as const,
            properties: Object.entries(tool.parameters).reduce(
                (acc, [key, param]) => {
                    acc[key] = {
                        type: param.type,
                        description: param.description,
                        enum: param.enum,
                    };
                    return acc;
                },
                {} as Record<string, unknown>
            ),
            required: Object.entries(tool.parameters)
                .filter(([, param]) => param.required)
                .map(([key]) => key),
        },
    };
}
