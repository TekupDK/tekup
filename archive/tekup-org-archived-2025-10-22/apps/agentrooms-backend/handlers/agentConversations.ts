import { Context } from "hono";
import { validateEncodedProjectName } from "../history/pathUtils.ts";
import { loadConversation } from "../history/conversationLoader.ts";

/**
 * Handles GET /api/agent-conversations/:encodedProjectName/:sessionId requests
 * Retrieves detailed conversation history for a specific session from agent endpoint
 * @param c - Hono context object with config variables
 * @returns JSON response with conversation details
 */
export async function handleAgentConversationRequest(c: Context) {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-backend-handle');

  try {
    const { debugMode, runtime } = c.var.config;
    const encodedProjectName = c.req.param("encodedProjectName");
    const sessionId = c.req.param("sessionId");

    if (!encodedProjectName) {
      return c.json({ error: "Encoded project name is required" }, 400);
    }

    if (!sessionId) {
      return c.json({ error: "Session ID is required" }, 400);
    }

    if (!validateEncodedProjectName(encodedProjectName)) {
      return c.json({ error: "Invalid encoded project name" }, 400);
    }

    if (debugMode) {
      logger.debug(
        `[DEBUG] Fetching agent conversation details for project: ${encodedProjectName}, session: ${sessionId}`,
      );
    }

    // Load the specific conversation (already returns processed ConversationHistory)
    const conversationHistory = await loadConversation(
      encodedProjectName,
      sessionId,
      runtime,
    );

    if (!conversationHistory) {
      return c.json(
        {
          error: "Agent conversation not found",
          sessionId,
        },
        404,
      );
    }

    if (debugMode) {
      logger.debug(
        `[DEBUG] Loaded agent conversation with ${conversationHistory.messages.length} messages`,
      );
    }

    return c.json(conversationHistory);
  } catch (error) {
    logger.error("Error fetching agent conversation details:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Invalid session ID")) {
        return c.json(
          {
            error: "Invalid session ID format",
            details: error.message,
          },
          400,
        );
      }

      if (error.message.includes("Invalid encoded project name")) {
        return c.json(
          {
            error: "Invalid project name",
            details: error.message,
          },
          400,
        );
      }
    }

    return c.json(
      {
        error: "Failed to fetch agent conversation details",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
}