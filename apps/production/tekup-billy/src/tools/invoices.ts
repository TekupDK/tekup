/**
 * Invoice management tools for Billy.dk MCP server
 * Implements list, create, get, and send invoice functionality
 */

import { z } from "zod";
import { BillyClient } from "../billy-client.js";
import { dataLogger } from "../utils/data-logger.js";
import { extractBillyErrorMessage } from "../utils/error-handler.js";
import { log } from "../utils/logger.js";

// Input schemas for validation
const listInvoicesSchema = z.object({
  startDate: z.string().optional().describe("Start date in YYYY-MM-DD format"),
  endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
  state: z
    .enum(["draft", "approved", "voided"])
    .optional()
    .describe(
      "Invoice state filter (Billy API only supports: draft, approved, voided)"
    ),
  contactId: z.string().optional().describe("Filter by customer contact ID"),
  search: z
    .string()
    .optional()
    .describe("Search term to filter by invoice number (client-side filtering)"),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Maximum number of invoices to return (default: 20, max: 100)"),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Number of invoices to skip for pagination (default: 0)"),
});

const createInvoiceSchema = z.object({
  contactId: z.string().describe("Customer contact ID"),
  entryDate: z.string().describe("Invoice date in YYYY-MM-DD format"),
  paymentTermsDays: z
    .number()
    .optional()
    .describe("Payment terms in days (default: 30)"),
  lines: z
    .array(
      z.object({
        description: z.string().describe("Line item description"),
        quantity: z.number().positive().describe("Quantity"),
        unitPrice: z.number().describe("Unit price"),
        productId: z
          .string()
          .describe(
            "Product ID (required by Billy API - use list_products to find valid IDs)"
          ),
      })
    )
    .min(1)
    .describe("Invoice line items"),
});

const getInvoiceSchema = z.object({
  invoiceId: z.string().describe("Invoice ID to retrieve"),
});

const sendInvoiceSchema = z.object({
  invoiceId: z.string().describe("Invoice ID to send"),
  message: z
    .string()
    .optional()
    .describe("Optional message to include with the invoice"),
});

/**
 * List invoices with optional filtering
 */
export async function listInvoices(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const params = listInvoicesSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: "listInvoices",
      tool: "invoices",
      parameters: params,
    });

    let invoices = await client.getInvoices(params);

    // Add null checks
    if (!invoices || !Array.isArray(invoices)) {
      log.error("Invalid invoices response from Billy API", null, { invoices });
      throw new Error(
        "Invalid response format from Billy API - expected array of invoices"
      );
    }

    // Client-side filtering for search parameter (invoice number search)
    // Billy API doesn't support text search on invoices, so we filter client-side
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim().toLowerCase();
      const originalCount = invoices.length;
      
      invoices = invoices.filter((invoice) => {
        const invoiceNo = (invoice.invoiceNo || "").toLowerCase();
        
        return invoiceNo.includes(searchTerm);
      });
      
      if (invoices.length < originalCount) {
        log.debug("Client-side filtering applied (invoices)", {
          searchTerm,
          originalCount,
          filteredCount: invoices.length,
        });
      }
    }

    // Apply pagination
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    const totalCount = invoices.length;
    const paginatedInvoices = invoices.slice(offset, offset + limit);

    const invoiceList = paginatedInvoices.map((invoice) => ({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      state: invoice.state,
      contactId: invoice.contactId,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      entryDate: invoice.entryDate,
      dueDate: invoice.dueDate || invoice.paymentDate, // Use dueDate if available, fallback to paymentDate
      isPaid: invoice.isPaid || false,
      balance: invoice.balance,
    }));

    // Log successful completion
    await dataLogger.logAction({
      action: "listInvoices",
      tool: "invoices",
      parameters: params,
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: invoices.length,
      },
    });

    // Build response with pagination info
    const responseData = {
      success: true,
      message: `Found ${totalCount} invoices`,
      invoices: invoiceList,
      pagination: {
        total: totalCount,
        limit,
        offset,
        returned: invoiceList.length,
        hasMore: offset + limit < totalCount,
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
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("listInvoices error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    // Log error
    await dataLogger.logAction({
      action: "listInvoices",
      tool: "invoices",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error listing invoices: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const invoiceData = createInvoiceSchema.parse(args);

    // Validate that lines array is not empty
    if (!invoiceData.lines || invoiceData.lines.length === 0) {
      throw new Error("Invoice must have at least one line item");
    }

    // Validate that all lines have productId
    for (const line of invoiceData.lines) {
      if (!line.productId) {
        throw new Error(
          "All invoice lines must have a productId. Use list_products to find valid product IDs."
        );
      }
    }

    // Log the action
    await dataLogger.logAction({
      action: "createInvoice",
      tool: "invoices",
      parameters: invoiceData,
    });

    const invoice = await client.createInvoice(invoiceData);

    // Add null checks
    if (!invoice) {
      log.error("Invalid invoice creation response from Billy API", null, {
        invoice,
      });
      throw new Error(
        "Failed to create invoice - invalid response from Billy API"
      );
    }

    // Log successful completion
    await dataLogger.logAction({
      action: "createInvoice",
      tool: "invoices",
      parameters: invoiceData,
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    // Build success message with clear indication of draft state
    const successMessage =
      invoice.state === "draft"
        ? "✅ Invoice created successfully in DRAFT state. Review in Billy.dk before approving."
        : `Invoice created successfully with state: ${invoice.state}`;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: successMessage,
            invoice: {
              id: invoice.id,
              invoiceNo: invoice.invoiceNo,
              state: invoice.state,
              contactId: invoice.contactId,
              totalAmount: invoice.totalAmount,
              currency: invoice.currency,
              entryDate: invoice.entryDate,
              lines: invoice.lines || [],
            },
          }),
        },
      ],
      structuredContent: {
        success: true,
        message: successMessage,
        invoice: {
          id: invoice.id,
          invoiceNo: invoice.invoiceNo,
          state: invoice.state,
          contactId: invoice.contactId,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          entryDate: invoice.entryDate,
          lines: invoice.lines || [],
        },
      },
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("createInvoice error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    // Log error
    await dataLogger.logAction({
      action: "createInvoice",
      tool: "invoices",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error creating invoice: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Get detailed information about a specific invoice
 */
export async function getInvoice(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { invoiceId } = getInvoiceSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: "getInvoice",
      tool: "invoices",
      parameters: { invoiceId },
    });

    const invoice = await client.getInvoice(invoiceId);

    // Add null checks
    if (!invoice) {
      log.error("Invalid invoice response from Billy API", null, { invoice });
      throw new Error("Invoice not found or invalid response from Billy API");
    }

    // Log successful completion
    await dataLogger.logAction({
      action: "getInvoice",
      tool: "invoices",
      parameters: { invoiceId },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const invoiceData = {
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        state: invoice.state,
        contactId: invoice.contactId,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        entryDate: invoice.entryDate,
        paymentDate: invoice.paymentDate,
        paymentTermsDays: invoice.paymentTermsDays,
        lines: (invoice.lines || []).map((line) => ({
          id: line.id,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          amount: line.amount,
          productId: line.productId,
        })),
      },
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(invoiceData),
        },
      ],
      structuredContent: invoiceData,
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("getInvoice error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    // Log error
    await dataLogger.logAction({
      action: "getInvoice",
      tool: "invoices",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error retrieving invoice: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Send an invoice to the customer
 */
export async function sendInvoice(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { invoiceId, message } = sendInvoiceSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: "sendInvoice",
      tool: "invoices",
      parameters: { invoiceId, message },
    });

    await client.sendInvoice(invoiceId, message);

    // Log successful completion
    await dataLogger.logAction({
      action: "sendInvoice",
      tool: "invoices",
      parameters: { invoiceId, message },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const responseData = {
      success: true,
      message: "Invoice sent successfully",
      invoiceId,
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
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("sendInvoice error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    // Log error
    await dataLogger.logAction({
      action: "sendInvoice",
      tool: "invoices",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error sending invoice: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

// Sprint 1: New invoice lifecycle tools

const updateInvoiceSchema = z.object({
  invoiceId: z.string().describe("Invoice ID to update"),
  contactId: z.string().optional().describe("Customer contact ID"),
  entryDate: z
    .string()
    .optional()
    .describe("Invoice date in YYYY-MM-DD format"),
  paymentTermsDays: z.number().optional().describe("Payment terms in days"),
  lines: z
    .array(
      z.object({
        description: z.string().describe("Line item description"),
        quantity: z.number().positive().describe("Quantity"),
        unitPrice: z.number().describe("Unit price"),
        productId: z.string().describe("Product ID (required by Billy API)"),
      })
    )
    .optional()
    .describe("Invoice line items"),
});

/**
 * Update an existing invoice
 */
export async function updateInvoice(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { invoiceId, ...updateData } = updateInvoiceSchema.parse(args);

    await dataLogger.logAction({
      action: "updateInvoice",
      tool: "invoices",
      parameters: { invoiceId, updateData },
    });

    const invoice = await client.updateInvoice(invoiceId, updateData);

    await dataLogger.logAction({
      action: "updateInvoice",
      tool: "invoices",
      parameters: { invoiceId, updateData },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: "Invoice updated successfully",
            invoice: {
              id: invoice.id,
              invoiceNo: invoice.invoiceNo,
              state: invoice.state,
              totalAmount: invoice.totalAmount,
            },
          }),
        },
      ],
      structuredContent: {
        success: true,
        message: "Invoice updated successfully",
        invoice,
      },
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("updateInvoice error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    await dataLogger.logAction({
      action: "updateInvoice",
      tool: "invoices",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error updating invoice: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

const approveInvoiceSchema = z.object({
  invoiceId: z.string().describe("Invoice ID to approve"),
});

/**
 * Approve an invoice (change state from draft to approved)
 *
 * ⚠️ IMPORTANT: This action is PERMANENT and assigns a final invoice number.
 * Only use this when the invoice has been reviewed and is ready to be sent.
 * The user should MANUALLY review the invoice in Billy.dk before approval.
 *
 * DO NOT call this automatically after create_invoice - let the user review first!
 */
export async function approveInvoice(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { invoiceId } = approveInvoiceSchema.parse(args);

    await dataLogger.logAction({
      action: "approveInvoice",
      tool: "invoices",
      parameters: { invoiceId },
    });

    const invoice = await client.approveInvoice(invoiceId);

    await dataLogger.logAction({
      action: "approveInvoice",
      tool: "invoices",
      parameters: { invoiceId },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: `Invoice ${invoice.invoiceNo} approved successfully`,
            invoice: {
              id: invoice.id,
              invoiceNo: invoice.invoiceNo,
              state: invoice.state,
            },
          }),
        },
      ],
      structuredContent: {
        success: true,
        message: `Invoice ${invoice.invoiceNo} approved successfully`,
        invoice,
      },
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("approveInvoice error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    await dataLogger.logAction({
      action: "approveInvoice",
      tool: "invoices",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error approving invoice: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

const cancelInvoiceSchema = z.object({
  invoiceId: z.string().describe("Invoice ID to cancel"),
  reason: z.string().optional().describe("Optional reason for cancellation"),
});

/**
 * Cancel an invoice
 */
export async function cancelInvoice(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { invoiceId, reason } = cancelInvoiceSchema.parse(args);

    await dataLogger.logAction({
      action: "cancelInvoice",
      tool: "invoices",
      parameters: { invoiceId, reason },
    });

    const invoice = await client.cancelInvoice(invoiceId);

    await dataLogger.logAction({
      action: "cancelInvoice",
      tool: "invoices",
      parameters: { invoiceId, reason },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: `Invoice ${invoice.invoiceNo} cancelled successfully`,
            invoice: {
              id: invoice.id,
              invoiceNo: invoice.invoiceNo,
              state: invoice.state,
            },
          }),
        },
      ],
      structuredContent: {
        success: true,
        message: `Invoice ${invoice.invoiceNo} cancelled successfully`,
        invoice,
      },
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("cancelInvoice error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    await dataLogger.logAction({
      action: "cancelInvoice",
      tool: "invoices",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error cancelling invoice: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

const markInvoicePaidSchema = z.object({
  invoiceId: z.string().describe("Invoice ID to mark as paid"),
  paymentDate: z.string().describe("Payment date in YYYY-MM-DD format"),
  amount: z
    .number()
    .optional()
    .describe("Payment amount (defaults to invoice total)"),
});

/**
 * Mark an invoice as paid
 */
export async function markInvoicePaid(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { invoiceId, paymentDate, amount } =
      markInvoicePaidSchema.parse(args);

    await dataLogger.logAction({
      action: "markInvoicePaid",
      tool: "invoices",
      parameters: { invoiceId, paymentDate, amount },
    });

    const invoice = await client.markInvoicePaid(
      invoiceId,
      paymentDate,
      amount
    );

    await dataLogger.logAction({
      action: "markInvoicePaid",
      tool: "invoices",
      parameters: { invoiceId, paymentDate, amount },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: `Invoice ${invoice.invoiceNo} marked as paid`,
            invoice: {
              id: invoice.id,
              invoiceNo: invoice.invoiceNo,
              state: invoice.state,
              paymentDate: invoice.paymentDate,
              totalAmount: invoice.totalAmount,
            },
          }),
        },
      ],
      structuredContent: {
        success: true,
        message: `Invoice ${invoice.invoiceNo} marked as paid`,
        invoice,
      },
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("markInvoicePaid error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    await dataLogger.logAction({
      action: "markInvoicePaid",
      tool: "invoices",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error marking invoice as paid: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
