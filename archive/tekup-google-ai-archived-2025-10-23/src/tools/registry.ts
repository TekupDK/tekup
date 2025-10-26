/**
 * RenOS Tool Registry
 * 
 * Central registry for all agent tools following ADK pattern.
 * 
 * Features:
 * - Dynamic tool discovery based on context
 * - Categorized toolsets (lead, calendar, email)
 * - Context-aware tool availability
 * - Automatic Gemini Function Calling conversion
 * 
 * Usage:
 * ```typescript
 * import { toolRegistry } from './tools/registry';
 * 
 * // Get all available tools
 * const tools = await toolRegistry.getAllTools(context);
 * 
 * // Find specific tool
 * const tool = await toolRegistry.getTool('parse_lead_email');
 * 
 * // Execute tool
 * const result = await tool.handler(params, context);
 * ```
 */

import { BaseToolset, BaseTool, toGeminiFunctionDeclaration } from "./baseToolset";
import { ToolContext } from "./toolContext";
import { LeadToolset } from "./toolsets/leadToolset";
import { CalendarToolset } from "./toolsets/calendarToolset";
// import { EmailToolset } from "./toolsets/emailToolset"; // Temporarily disabled
import { logger } from "../logger";

export class RenOSToolRegistry {
    private toolsets: BaseToolset[] = [
        new LeadToolset(),
        new CalendarToolset(),
        // new EmailToolset(), // Temporarily disabled
    ];

    /**
     * Get all available tools for current context
     * 
     * ADK pattern: Tools can be dynamically provided based on:
     * - User permissions
     * - Session state
     * - Application configuration
     * 
     * @param context - Optional tool context for dynamic tool selection
     * @returns List of all available tools
     */
    async getAllTools(context?: ToolContext): Promise<BaseTool[]> {
        const allTools: BaseTool[] = [];

        for (const toolset of this.toolsets) {
            try {
                const tools = await toolset.getTools(context);
                allTools.push(...tools);
                logger.debug(
                    { toolset: toolset.name, toolCount: tools.length },
                    "Loaded tools from toolset"
                );
            } catch (error) {
                logger.error(
                    { error, toolset: toolset.name },
                    "Failed to load tools from toolset"
                );
            }
        }

        logger.info({ totalTools: allTools.length }, "Tool registry initialized");
        return allTools;
    }

    /**
     * Find specific tool by name
     * 
     * @param name - Tool name (e.g., 'parse_lead_email')
     * @param context - Optional tool context
     * @returns Tool if found, null otherwise
     */
    async getTool(name: string, context?: ToolContext): Promise<BaseTool | null> {
        const allTools = await this.getAllTools(context);
        return allTools.find((t) => t.name === name) || null;
    }

    /**
     * Get tools by category
     * 
     * @param category - Tool category (e.g., 'lead_processing', 'calendar_health')
     * @param context - Optional tool context
     * @returns List of tools in category
     */
    async getToolsByCategory(category: string, context?: ToolContext): Promise<BaseTool[]> {
        const allTools = await this.getAllTools(context);
        return allTools.filter((t) => t.category === category);
    }

    /**
     * Get tools as Gemini Function Calling format
     * 
     * Converts tools to format compatible with Gemini's completeChatWithFunctions()
     * 
     * @param context - Optional tool context
     * @returns Array of Gemini function declarations
     */
    async getGeminiTools(context?: ToolContext) {
        const tools = await this.getAllTools(context);
        return tools.map(toGeminiFunctionDeclaration);
    }

    /**
     * Execute a tool by name
     * 
     * Convenience method for tool execution
     * 
     * @param name - Tool name
     * @param params - Tool parameters
     * @param context - Tool context
     * @returns Tool execution result
     */
    async executeTool(
        name: string,
        params: Record<string, unknown>,
        context?: ToolContext
    ): Promise<Record<string, unknown>> {
        const tool = await this.getTool(name, context);

        if (!tool) {
            logger.error({ toolName: name }, "Tool not found");
            return {
                status: "error",
                error_message: `Tool '${name}' not found in registry`,
                available_tools: (await this.getAllTools(context)).map((t) => t.name),
            };
        }

        try {
            logger.info({ toolName: name, params }, "Executing tool");
            const result = await tool.handler(params, context);
            logger.info({ toolName: name, status: result.status }, "Tool execution completed");
            return result;
        } catch (error) {
            logger.error({ error, toolName: name }, "Tool execution failed");
            return {
                status: "error",
                error_message: error instanceof Error ? error.message : "Unknown error",
                tool: name,
            };
        }
    }

    /**
     * Get tool registry statistics
     * 
     * Useful for monitoring and debugging
     * 
     * @param context - Optional tool context
     * @returns Registry statistics
     */
    async getStatistics(context?: ToolContext): Promise<{
        total_tools: number;
        toolsets: Array<{ name: string; tool_count: number }>;
        categories: Record<string, number>;
        tools_by_category: Record<string, string[]>;
    }> {
        const tools = await this.getAllTools(context);

        const categories = tools.reduce(
            (acc, tool) => {
                const cat = tool.category || "uncategorized";
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const toolsByCategory = tools.reduce(
            (acc, tool) => {
                const cat = tool.category || "uncategorized";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(tool.name);
                return acc;
            },
            {} as Record<string, string[]>
        );

        const toolsetStats = await Promise.all(
            this.toolsets.map(async (ts) => ({
                name: ts.name,
                tool_count: (await ts.getTools(context)).length,
            }))
        );

        return {
            total_tools: tools.length,
            toolsets: toolsetStats,
            categories,
            tools_by_category: toolsByCategory,
        };
    }

    /**
     * Validate tool availability and configuration
     * 
     * Checks that all tools are properly configured and accessible
     * 
     * @param context - Optional tool context
     * @returns Validation results
     */
    async validate(context?: ToolContext): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            const tools = await this.getAllTools(context);

            if (tools.length === 0) {
                errors.push("No tools available in registry");
            }

            // Check for duplicate tool names
            const toolNames = tools.map((t) => t.name);
            const duplicates = toolNames.filter(
                (name, index) => toolNames.indexOf(name) !== index
            );
            if (duplicates.length > 0) {
                errors.push(`Duplicate tool names found: ${duplicates.join(", ")}`);
            }

            // Check for tools without descriptions
            const missingDescriptions = tools.filter((t) => !t.description);
            if (missingDescriptions.length > 0) {
                warnings.push(
                    `${missingDescriptions.length} tool(s) missing descriptions: ${missingDescriptions.map((t) => t.name).join(", ")}`
                );
            }

            // Check for tools without categories
            const uncategorized = tools.filter((t) => !t.category);
            if (uncategorized.length > 0) {
                warnings.push(
                    `${uncategorized.length} tool(s) without category: ${uncategorized.map((t) => t.name).join(", ")}`
                );
            }

        } catch (error) {
            errors.push(`Registry validation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Cleanup all toolsets (ADK pattern)
     * 
     * Called when:
     * - Application is shutting down
     * - Tool registry is being destroyed
     * 
     * Ensures proper resource cleanup
     */
    async close(): Promise<void> {
        logger.info("Closing tool registry...");
        await Promise.all(
            this.toolsets.map(async (ts) => {
                try {
                    await ts.close();
                    logger.debug({ toolset: ts.name }, "Toolset closed");
                } catch (error) {
                    logger.error({ error, toolset: ts.name }, "Failed to close toolset");
                }
            })
        );
        logger.info("Tool registry closed");
    }
}

/**
 * Singleton tool registry instance
 * 
 * Usage:
 * ```typescript
 * import { toolRegistry } from './tools/registry';
 * const tools = await toolRegistry.getAllTools();
 * ```
 */
export const toolRegistry = new RenOSToolRegistry();
