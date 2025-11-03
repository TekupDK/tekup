/**
 * Invoice Caching Utilities
 *
 * Cache Billy invoices to database in background
 */

import { eq, and } from "drizzle-orm";
import { customerInvoices, customerProfiles } from "../drizzle/schema";
import type { BillyInvoice } from "./billy";
import { getCustomer } from "./billy";
import { createOrUpdateCustomerProfile, addCustomerInvoice } from "./customer-db";

/**
 * Map Billy invoice state to customer_invoice_status enum
 */
function mapInvoiceStatus(
  billyState: string
): "draft" | "approved" | "sent" | "paid" | "overdue" | "voided" {
  const stateMap: Record<string, "draft" | "approved" | "sent" | "paid" | "overdue" | "voided"> = {
    draft: "draft",
    approved: "approved",
    sent: "sent",
    paid: "paid",
    overdue: "overdue",
    voided: "voided",
    cancelled: "voided",
  };

  return stateMap[billyState?.toLowerCase()] || "draft";
}

/**
 * Cache Billy invoices to database (background job)
 */
export async function cacheInvoicesToDatabase(
  invoices: BillyInvoice[],
  userId: number,
  db: any
): Promise<void> {
  try {
    for (const invoice of invoices) {
      // Get customer from Billy API to get email/name
      const customer = await getCustomer(invoice.contactId);
      if (!customer) {
        console.warn(`[Invoice Cache] Customer not found for contactId: ${invoice.contactId}`);
        continue;
      }

      // Create or update customer profile
      let customerProfileId: number;
      try {
        customerProfileId = await createOrUpdateCustomerProfile({
          userId,
          email: customer.email || `customer-${invoice.contactId}@unknown.local`,
          name: customer.name || undefined,
          phone: customer.phone || undefined,
          billyCustomerId: invoice.contactId,
          billyOrganizationId: invoice.organizationId,
        });
      } catch (error) {
        console.error(`[Invoice Cache] Error creating/updating customer profile:`, error);
        continue;
      }

      // Calculate amounts from invoice lines
      // Billy API unitPrice is in the invoice currency (not øre), convert to øre
      const amount = invoice.lines
        ? Math.round(
            invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) * 100
          )
        : 0;

      // Calculate due date from entry date and payment terms
      const entryDate = invoice.entryDate ? new Date(invoice.entryDate) : new Date();
      const dueDate = invoice.paymentTermsDays
        ? new Date(entryDate.getTime() + invoice.paymentTermsDays * 24 * 60 * 60 * 1000)
        : undefined;

      // Add invoice to database
      try {
        await addCustomerInvoice({
          customerId: customerProfileId,
          billyInvoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo || undefined,
          amount,
          paidAmount: 0, // Will be updated when invoice is marked as paid
          status: mapInvoiceStatus(invoice.state),
          entryDate,
          dueDate,
          paidDate: invoice.state === "paid" ? entryDate : undefined, // Assume paid if state is paid
        });
      } catch (error) {
        console.error(`[Invoice Cache] Error caching invoice ${invoice.id}:`, error);
        // Continue with next invoice even if one fails
      }
    }
  } catch (error) {
    console.error("[Invoice Cache] Error caching invoices:", error);
    throw error;
  }
}

