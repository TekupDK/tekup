/**
 * Revenue reporting tools for Billy.dk MCP server
 * Implements revenue analysis functionality
 */

import { z } from "zod";
import type { BillyClient } from "../billy-client.js";
import { dataLogger } from "../utils/data-logger.js";

// Input schema for validation
const getRevenueSchema = z.object({
  startDate: z.string().describe("Start date in YYYY-MM-DD format"),
  endDate: z.string().describe("End date in YYYY-MM-DD format"),
});

/**
 * Get revenue data for a specific period
 */
export async function getRevenue(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = getRevenueSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: "getRevenue",
      tool: "revenue",
      parameters: { startDate, endDate },
    });

    const revenueData = await client.getRevenue(startDate, endDate);

    // Log successful completion
    await dataLogger.logAction({
      action: "getRevenue",
      tool: "revenue",
      parameters: { startDate, endDate },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const responseData = {
      success: true,
      revenue: {
        period: revenueData.period,
        totalRevenue: revenueData.totalRevenue,
        paidInvoices: revenueData.paidInvoices,
        pendingInvoices: revenueData.pendingInvoices,
        overdueInvoices: revenueData.overdueInvoices,
        summary: {
          averageInvoiceValue:
            revenueData.paidInvoices > 0
              ? Math.round(
                  (revenueData.totalRevenue / revenueData.paidInvoices) * 100
                ) / 100
              : 0,
          totalInvoices:
            revenueData.paidInvoices +
            revenueData.pendingInvoices +
            revenueData.overdueInvoices,
          paymentRate:
            revenueData.paidInvoices > 0
              ? Math.round(
                  (revenueData.paidInvoices /
                    (revenueData.paidInvoices +
                      revenueData.pendingInvoices +
                      revenueData.overdueInvoices)) *
                    100
                )
              : 0,
        },
      },
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
      action: "getRevenue",
      tool: "revenue",
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
          text: `Error retrieving revenue data: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}
