/**
 * Invoice Caching Utilities
 *
 * Cache Billy invoices to database in background
 */

import type { BillyInvoice } from "./billy";
import { getCustomer } from "./billy";
import {
  addCustomerInvoice,
  createOrUpdateCustomerProfile,
} from "./customer-db";

/**
 * Map Billy invoice state to customer_invoice_status enum
 */
function mapInvoiceStatus(
  billyState: string
): "draft" | "approved" | "sent" | "paid" | "overdue" | "voided" {
  const stateMap: Record<
    string,
    "draft" | "approved" | "sent" | "paid" | "overdue" | "voided"
  > = {
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
        console.warn(
          `[Invoice Cache] Customer not found for contactId: ${invoice.contactId}`
        );
        continue;
      }

      // Create or update customer profile
      let customerProfileId: number;
      try {
        customerProfileId = await createOrUpdateCustomerProfile({
          userId,
          email:
            customer.email || `customer-${invoice.contactId}@unknown.local`,
          name: customer.name || undefined,
          phone: customer.phone || undefined,
          billyCustomerId: invoice.contactId,
          billyOrganizationId: invoice.organizationId,
        });
      } catch (error) {
        console.error(
          `[Invoice Cache] Error creating/updating customer profile:`,
          error
        );
        continue;
      }

      // Calculate amounts from invoice lines
      // Billy API unitPrice is in the invoice currency (not øre), convert to øre
      const amount = invoice.lines
        ? Math.round(
            invoice.lines.reduce(
              (sum: number, line) => sum + line.quantity * line.unitPrice,
              0
            ) * 100
          ).toString()
        : "0";

      // Calculate due date from entry date and payment terms
      const entryDate = invoice.entryDate
        ? new Date(invoice.entryDate)
        : new Date();
      const dueDate = invoice.paymentTermsDays
        ? new Date(
            entryDate.getTime() + invoice.paymentTermsDays * 24 * 60 * 60 * 1000
          ).toISOString()
        : undefined;

      // Add invoice to database
      try {
        await addCustomerInvoice({
          userId,
          customerId: customerProfileId,
          billyInvoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNo || undefined,
          amount,
          status: mapInvoiceStatus(invoice.state),
          dueDate,
          paidAt:
            invoice.state === "paid" ? entryDate.toISOString() : undefined,
        });
      } catch (error) {
        console.error(
          `[Invoice Cache] Error caching invoice ${invoice.id}:`,
          error
        );
        // Continue with next invoice even if one fails
      }
    }
  } catch (error) {
    console.error("[Invoice Cache] Error caching invoices:", error);
    throw error;
  }
}
