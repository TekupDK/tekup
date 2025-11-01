/**
 * Email Router (tRPC)
 *
 * Email-related procedures that use MCP service to interact with Gmail.
 * This follows the Tekup AI pattern of using McpService for external integrations.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../trpc.instance";

// Input validation schemas
const listEmailsInput = z.object({
  maxResults: z.number().min(1).max(500).default(50),
  labelIds: z.array(z.string()).optional(),
  q: z.string().optional(), // Gmail search query
});

const getEmailInput = z.object({
  messageId: z.string(),
});

const searchEmailsInput = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(1).max(100).default(20),
});

const sendEmailInput = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
});

export const emailRouter = router({
  /**
   * List emails using Gmail MCP server
   */
  list: protectedProcedure
    .input(listEmailsInput)
    .query(async ({ ctx, input }) => {
      // Get McpService from context (injected by TrpcService)
      const mcpService = ctx.mcpService;

      if (!mcpService) {
        throw new Error("MCP service not available");
      }

      // Get Gmail MCP server ID for this user
      const gmailServerId = await getGmailServerId(ctx.userId!, ctx.prisma);

      if (!gmailServerId) {
        throw new Error("Gmail MCP server not configured");
      }

      // Call MCP tool: list_emails
      const result = await mcpService.callTool({
        serverId: gmailServerId,
        toolName: "list_emails",
        arguments: {
          maxResults: input.maxResults,
          labelIds: input.labelIds || ["INBOX"],
          q: input.q,
        },
      });

      return {
        emails: result.emails || [],
        resultSizeEstimate: result.resultSizeEstimate || 0,
      };
    }),

  /**
   * Get single email by message ID
   */
  get: protectedProcedure.input(getEmailInput).query(async ({ ctx, input }) => {
    const mcpService = ctx.mcpService;

    if (!mcpService) {
      throw new Error("MCP service not available");
    }

    const gmailServerId = await getGmailServerId(ctx.userId!, ctx.prisma);

    if (!gmailServerId) {
      throw new Error("Gmail MCP server not configured");
    }

    const result = await mcpService.callTool({
      serverId: gmailServerId,
      toolName: "get_email",
      arguments: {
        messageId: input.messageId,
      },
    });

    return result;
  }),

  /**
   * Search emails using Gmail search
   */
  search: protectedProcedure
    .input(searchEmailsInput)
    .query(async ({ ctx, input }) => {
      const mcpService = ctx.mcpService;

      if (!mcpService) {
        throw new Error("MCP service not available");
      }

      const gmailServerId = await getGmailServerId(ctx.userId!, ctx.prisma);

      if (!gmailServerId) {
        throw new Error("Gmail MCP server not configured");
      }

      const result = await mcpService.callTool({
        serverId: gmailServerId,
        toolName: "search_emails",
        arguments: {
          query: input.query,
          maxResults: input.maxResults,
        },
      });

      return {
        emails: result.emails || [],
        query: input.query,
      };
    }),

  /**
   * Send email using Gmail MCP server
   */
  send: protectedProcedure
    .input(sendEmailInput)
    .mutation(async ({ ctx, input }) => {
      const mcpService = ctx.mcpService;

      if (!mcpService) {
        throw new Error("MCP service not available");
      }

      const gmailServerId = await getGmailServerId(ctx.userId!, ctx.prisma);

      if (!gmailServerId) {
        throw new Error("Gmail MCP server not configured");
      }

      const result = await mcpService.callTool({
        serverId: gmailServerId,
        toolName: "send_email",
        arguments: {
          to: input.to,
          subject: input.subject,
          body: input.body,
          cc: input.cc,
          bcc: input.bcc,
        },
      });

      return {
        messageId: result.messageId,
        threadId: result.threadId,
        success: true,
      };
    }),

  /**
   * Get Gmail labels
   */
  getLabels: protectedProcedure.query(async ({ ctx }) => {
    const mcpService = (ctx.req as any).app?.get?.("McpService") || null;

    if (!mcpService) {
      throw new Error("MCP service not available");
    }

    const gmailServerId = await getGmailServerId(ctx.userId!, ctx.prisma);

    if (!gmailServerId) {
      throw new Error("Gmail MCP server not configured");
    }

    const result = await mcpService.callTool({
      serverId: gmailServerId,
      toolName: "list_labels",
      arguments: {},
    });

    return {
      labels: result.labels || [],
    };
  }),
});

/**
 * Helper: Get Gmail MCP server ID for user
 *
 * Retrieves the Gmail MCP server ID from user's enabled MCP servers.
 * Uses the McpService pattern from Tekup AI.
 */
async function getGmailServerId(
  userId: string,
  prisma: any
): Promise<string | null> {
  try {
    // Get user's enabled MCP servers
    const userSettings = await prisma.aiUserSettings.findUnique({
      where: { userId },
      select: { enabledMcpServers: true },
    });

    const enabledServerIds =
      (userSettings?.enabledMcpServers as string[]) || [];

    if (enabledServerIds.length === 0) {
      return null;
    }

    // Find Gmail server in enabled servers
    const servers = await prisma.aiMcpServerRegistry.findMany({
      where: {
        id: { in: enabledServerIds },
        isActive: true,
      },
    });

    // Look for Gmail server by name or type
    const gmailServer = servers.find(
      (server) =>
        server.name?.toLowerCase().includes("gmail") ||
        server.displayName?.toLowerCase().includes("gmail")
    );

    return gmailServer?.id || null;
  } catch (error) {
    console.error("Error getting Gmail server ID:", error);
    return null;
  }
}
