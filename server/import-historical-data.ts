/**
 * Historical Data Import
 * Imports leads and customer profiles from existing Billy invoices and calendar events
 * Date range: July 2025 to present
 */

import { getInvoices } from "./billy";
import { createOrUpdateCustomerProfile } from "./customer-db";
import { createLead, getHistoricalCalendarEvents, getUserLeads } from "./db";

interface ImportResult {
  leadsCreated: number;
  customersCreated: number;
  errors: string[];
}

// Legacy type for Billy invoice with contact info
type BillyInvoiceWithContact = any;

/**
 * Extract customer info from Billy invoice
 */
function extractCustomerInfoFromInvoice(invoice: BillyInvoiceWithContact): {
  name: string | null;
  email: string | null;
  phone: string | null;
} {
  return {
    name: invoice.contact?.name || null,
    email: invoice.contact?.email || null,
    phone: invoice.contact?.phone || null,
  };
}

/**
 * Extract customer info from calendar event (parse title/description)
 */
function extractCustomerInfoFromEvent(event: {
  title: string;
  description: string | null;
}): {
  name: string | null;
  email: string | null;
} {
  const title = event.title || "";
  const description = event.description || "";
  const combined = `${title} ${description}`.toLowerCase();

  // Try to extract email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/gi;
  const emailMatch = combined.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : null;

  // Try to extract name (common patterns)
  // Look for patterns like "Meeting with John Doe" or "Call: Jane Smith"
  const namePatterns = [
    /(?:med|with|til)\s+([A-ZÆØÅ][a-zæøå]+\s+[A-ZÆØÅ][a-zæøå]+)/gi,
    /([A-ZÆØÅ][a-zæøå]+\s+[A-ZÆØÅ][a-zæøå]+)/gi,
  ];

  let name: string | null = null;
  for (const pattern of namePatterns) {
    const match = combined.match(pattern);
    if (match && match[0]) {
      name = match[0].trim();
      break;
    }
  }

  // If no name found, use title if it looks like a name
  if (!name && title && !title.includes(":") && !title.includes("@")) {
    const titleWords = title.split(" ");
    if (titleWords.length >= 2 && titleWords.length <= 4) {
      name = titleWords.join(" ");
    }
  }

  return { name, email };
}

/**
 * Create or update customer profile from extracted info
 */
async function ensureCustomerProfile(
  userId: number,
  email: string | null,
  name: string | null,
  phone: string | null
): Promise<number | null> {
  if (!email && !name) return null;

  try {
    const customerId = await createOrUpdateCustomerProfile({
      userId,
      email: email || `unknown-${Date.now()}@placeholder.local`,
      name: name || undefined,
      phone: phone || undefined,
    });

    return customerId;
  } catch (error) {
    console.error("[Import] Error creating customer profile:", error);
    return null;
  }
}

/**
 * Import leads from Billy invoices
 */
async function importLeadsFromInvoices(
  userId: number,
  fromDate: Date = new Date("2025-07-01")
): Promise<{
  leadsCreated: number;
  customersCreated: number;
  errors: string[];
}> {
  let leadsCreated = 0;
  let customersCreated = 0;
  const errors: string[] = [];

  try {
    // Get all Billy invoices
    const invoices = await getInvoices();

    // Filter by date and get contact info
    const recentInvoices: BillyInvoiceWithContact[] = [];

    for (const inv of invoices) {
      const invDate = new Date(
        (inv as any).entryDate || (inv as any).createdAt || 0
      );
      if (invDate >= fromDate) {
        // Fetch contact details if we have contactId
        let contactInfo:
          | { id: string; name?: string; email?: string; phone?: string }
          | undefined;
        if ((inv as any).contactId) {
          try {
            const { getCustomer } = await import("./billy");
            const contact = await getCustomer((inv as any).contactId);
            if (contact) {
              contactInfo = {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
              };
            }
          } catch (error) {
            console.warn(
              `[Import] Could not fetch contact ${(inv as any).contactId}:`,
              error
            );
          }
        }

        recentInvoices.push({
          id: inv.id,
          invoiceNo: (inv as any).invoiceNo,
          contactId: (inv as any).contactId || "",
          contact: contactInfo,
          entryDate: (inv as any).entryDate,
          createdAt: (inv as any).createdAt,
        });
      }
    }

    console.log(
      `[Import] Found ${recentInvoices.length} invoices from ${fromDate.toISOString()}`
    );

    // Get existing leads to avoid duplicates
    const existingLeads = await getUserLeads(userId);
    const existingEmails = new Set(
      existingLeads.filter(l => l.email).map(l => l.email!.toLowerCase())
    );

    // Process each invoice
    for (const invoice of recentInvoices) {
      try {
        const customerInfo = extractCustomerInfoFromInvoice(invoice as any);

        // Skip if no email or name
        if (!customerInfo.email && !customerInfo.name) {
          console.log(
            `[Import] Skipping invoice ${invoice.id} - no customer info found`
          );
          continue;
        }

        // Check if lead already exists
        if (
          customerInfo.email &&
          existingEmails.has(customerInfo.email.toLowerCase())
        ) {
          continue;
        }

        // Create customer profile
        const customerId = await ensureCustomerProfile(
          userId,
          customerInfo.email,
          customerInfo.name,
          customerInfo.phone
        );
        if (customerId) customersCreated++;

        // Create lead
        await createLead({
          userId,
          source: "billy_import",
          name: customerInfo.name || "Unknown",
          email: customerInfo.email || undefined,
          phone: customerInfo.phone || undefined,
          status: "new",
          metadata: {
            billyInvoiceId: invoice.id,
            billyContactId: invoice.contactId,
            importDate: new Date().toISOString(),
          },
        });

        leadsCreated++;

        // Add to existing emails to avoid duplicates in same batch
        if (customerInfo.email) {
          existingEmails.add(customerInfo.email.toLowerCase());
        }
      } catch (error) {
        const errorMsg = `Error processing invoice ${invoice.id}: ${error}`;
        console.error(`[Import] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
  } catch (error) {
    errors.push(`Error fetching invoices: ${error}`);
  }

  return { leadsCreated, customersCreated, errors };
}

/**
 * Import leads from calendar events
 */
async function importLeadsFromEvents(
  userId: number,
  fromDate: Date = new Date("2025-07-01")
): Promise<{
  leadsCreated: number;
  customersCreated: number;
  errors: string[];
}> {
  let leadsCreated = 0;
  let customersCreated = 0;
  const errors: string[] = [];

  try {
    // Get all calendar events
    const events = await getHistoricalCalendarEvents(userId, fromDate);

    console.log(
      `[Import] Found ${events.length} calendar events from ${fromDate.toISOString()}`
    );

    // Get existing leads to avoid duplicates
    const existingLeads = await getUserLeads(userId);
    const existingEmails = new Set(
      existingLeads.filter(l => l.email).map(l => l.email!.toLowerCase())
    );
    const existingNames = new Set(
      existingLeads.filter(l => l.name).map(l => l.name!.toLowerCase())
    );

    // Process each event
    for (const event of events) {
      try {
        const customerInfo = extractCustomerInfoFromEvent({
          title: event.title || "",
          description: event.description,
        });

        // Skip if no name or email
        if (!customerInfo.name && !customerInfo.email) {
          continue;
        }

        // Check if lead already exists
        if (
          customerInfo.email &&
          existingEmails.has(customerInfo.email.toLowerCase())
        ) {
          continue;
        }
        if (
          customerInfo.name &&
          existingNames.has(customerInfo.name.toLowerCase())
        ) {
          continue;
        }

        // Create customer profile
        const customerId = await ensureCustomerProfile(
          userId,
          customerInfo.email,
          customerInfo.name,
          null
        );
        if (customerId) customersCreated++;

        // Create lead
        await createLead({
          userId,
          source: "calendar_import",
          name: customerInfo.name || "Unknown",
          email: customerInfo.email || undefined,
          status: "new",
          metadata: {
            googleEventId: event.googleEventId,
            eventDate: event.startTime
              ? new Date(event.startTime).toISOString()
              : new Date().toISOString(),
            importDate: new Date().toISOString(),
          },
        });

        leadsCreated++;

        // Add to existing to avoid duplicates
        if (customerInfo.email) {
          existingEmails.add(customerInfo.email.toLowerCase());
        }
        if (customerInfo.name) {
          existingNames.add(customerInfo.name.toLowerCase());
        }
      } catch (error) {
        const errorMsg = `Error processing event ${event.googleEventId}: ${error}`;
        console.error(`[Import] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
  } catch (error) {
    errors.push(`Error fetching calendar events: ${error}`);
  }

  return { leadsCreated, customersCreated, errors };
}

/**
 * Import all historical data (invoices + calendar events)
 */
export async function importHistoricalData(
  userId: number,
  fromDate: Date = new Date("2025-07-01")
): Promise<ImportResult> {
  console.log(
    `[Import] Starting historical data import from ${fromDate.toISOString()}`
  );

  // Import from invoices
  const invoiceResult = await importLeadsFromInvoices(userId, fromDate);
  console.log(
    `[Import] Invoices: ${invoiceResult.leadsCreated} leads, ${invoiceResult.customersCreated} customers`
  );

  // Import from calendar events
  const eventResult = await importLeadsFromEvents(userId, fromDate);
  console.log(
    `[Import] Events: ${eventResult.leadsCreated} leads, ${eventResult.customersCreated} customers`
  );

  const totalResult: ImportResult = {
    leadsCreated: invoiceResult.leadsCreated + eventResult.leadsCreated,
    customersCreated:
      invoiceResult.customersCreated + eventResult.customersCreated,
    errors: [...invoiceResult.errors, ...eventResult.errors],
  };

  console.log(
    `[Import] Total: ${totalResult.leadsCreated} leads, ${totalResult.customersCreated} customers`
  );
  if (totalResult.errors.length > 0) {
    console.warn(`[Import] ${totalResult.errors.length} errors occurred`);
  }

  return totalResult;
}
