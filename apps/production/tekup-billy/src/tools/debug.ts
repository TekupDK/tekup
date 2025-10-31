/**
 * Debug tools for Billy.dk MCP server
 * Provides debugging and validation functionality
 */

import { z } from "zod";
import { BillyClient } from "../billy-client.js";
import { dataLogger } from "../utils/data-logger.js";
import { log } from "../utils/logger.js";

// Input schemas for validation
const validateAuthSchema = z.object({
  // No parameters needed
});

const testConnectionSchema = z.object({
  endpoint: z
    .string()
    .optional()
    .describe("Specific endpoint to test (default: organization)"),
});

/**
 * Validate Billy API authentication and connection
 */
export async function validateAuth(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const params = validateAuthSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: "validateAuth",
      tool: "debug",
      parameters: params,
    });

    log.info("Starting Billy API authentication validation");

    const authResult = await client.validateAuth();

    // Log successful completion
    await dataLogger.logAction({
      action: "validateAuth",
      tool: "debug",
      parameters: params,
      result: authResult.valid ? "success" : "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: authResult.error,
      },
    });

    const responseData = {
      success: authResult.valid,
      message: authResult.valid
        ? "Billy API authentication successful"
        : "Billy API authentication failed",
      organization: authResult.organization,
      error: authResult.error,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(responseData),
        },
      ],
      structuredContent: responseData,
    };
  } catch (error) {
    // Log error
    await dataLogger.logAction({
      action: "validateAuth",
      tool: "debug",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error validating authentication: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Test specific Billy API endpoint
 */
export async function testConnection(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { endpoint = "organization" } = testConnectionSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: "testConnection",
      tool: "debug",
      parameters: { endpoint },
    });

    log.info("Testing Billy API connection", { endpoint });

    let result;
    switch (endpoint) {
      case "organization":
        result = await client.getOrganization();
        break;
      case "contacts":
        result = await client.getContacts("customer");
        break;
      case "products":
        result = await client.getProducts();
        break;
      case "invoices":
        result = await client.getInvoices();
        break;
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    // Log successful completion
    await dataLogger.logAction({
      action: "testConnection",
      tool: "debug",
      parameters: { endpoint },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: Array.isArray(result) ? result.length : 1,
      },
    });

    const responseData = {
      success: true,
      message: `Successfully connected to Billy API ${endpoint} endpoint`,
      endpoint,
      data: result,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(responseData),
        },
      ],
      structuredContent: responseData,
    };
  } catch (error) {
    // Log error
    await dataLogger.logAction({
      action: "testConnection",
      tool: "debug",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error testing connection: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}
