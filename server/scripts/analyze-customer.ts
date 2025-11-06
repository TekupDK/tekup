import "dotenv/config";
import type { TrpcContext } from "../_core/context";
import { ENV } from "../_core/env";
import * as db from "../db";
import { appRouter } from "../routers";

async function main() {
  const name = process.argv[2] || "Emil Lærke";
  const email = process.argv[3] || "emil.laerke@example.com";

  if (!ENV.databaseUrl) {
    console.error("DATABASE_URL is not set. Please configure .env.");
    process.exit(1);
  }
  if (!ENV.ownerOpenId) {
    console.error("OWNER_OPEN_ID is not set. Please configure .env.");
    process.exit(1);
  }

  const dbConn = await db.getDb();
  if (!dbConn) {
    console.error("Could not connect to database. Check DATABASE_URL.");
    process.exit(1);
  }

  // Ensure owner user exists
  await db.upsertUser({
    openId: ENV.ownerOpenId,
    name: "Owner",
    loginMethod: "dev",
    lastSignedIn: new Date().toISOString(),
  });
  const user = await db.getUserByOpenId(ENV.ownerOpenId);
  if (!user) {
    console.error("Failed to create/find owner user.");
    process.exit(1);
  }

  // Prepare TRPC caller with authenticated context
  const ctx: TrpcContext = {
    req: {} as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
    user,
  };
  const caller = appRouter.createCaller(ctx);

  // Create or find lead
  const leads = await db.getUserLeads(user.id, { searchQuery: email });
  const foundLead = leads.find(
    l => l.email?.toLowerCase() === email.toLowerCase()
  );
  let leadId: number;
  if (!foundLead) {
    const created = await db.createLead({
      userId: user.id,
      source: "analysis_script",
      name,
      email,
      status: "new",
      score: 0,
      notes: "Created by analyze-customer script",
      company: null,
      phone: null,
      metadata: null,
    } as any);
    leadId = created.id;
    console.log(`Created lead ${leadId} for ${name} <${email}>`);
  } else {
    leadId = foundLead.id;
    console.log(`Found existing lead ${leadId} for ${name} <${email}>`);
  }

  // Get or create customer profile by leadId
  const profile = await caller.customer.getProfileByLeadId({ leadId });
  if (!profile) {
    throw new Error("Failed to load or create customer profile");
  }
  const customerId = profile.id;
  console.log("Customer profile:", {
    id: customerId,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    balance: profile.balance,
    invoiceCount: profile.invoiceCount,
    emailCount: profile.emailCount,
  });

  // Try syncing Gmail emails (optional)
  try {
    await caller.customer.syncGmailEmails({ customerId });
  } catch (err: any) {
    console.warn("syncGmailEmails failed (continuing):", err?.message || err);
  }

  const emails = await caller.customer.getEmails({ customerId });

  // Calendar events
  const events = await caller.customer.getCalendarEvents({ customerId });

  // Invoices
  const invoices = await caller.customer.getInvoices({ customerId });

  // Try AI resume (optional)
  let resume: string | undefined;
  try {
    const res = await caller.customer.generateResume({ customerId });
    resume = res.resume;
  } catch (err: any) {
    console.warn("generateResume failed (continuing):", err?.message || err);
  }

  // Build analysis
  console.log("\n===== Customer Analysis =====");
  console.log(`Name: ${profile.name || name}`);
  console.log(`Email: ${profile.email}`);
  console.log(`Phone: ${profile.phone || "N/A"}`);
  console.log(`Invoices: ${invoices.length}`);
  console.log(`Email Threads: ${emails.length}`);
  console.log(`Calendar Events: ${events.length}`);

  if (emails.length > 0) {
    const recent = emails
      .slice(0, 5)
      .map(e => `- ${e.subject || e.snippet}`)
      .join("\n");
    console.log("\nRecent Emails:\n" + recent);
  }

  if (events.length > 0) {
    const upcoming = events
      .slice(0, 5)
      .map(
        e =>
          `- ${e.title || "Event"} on ${e.startTime ? new Date(e.startTime).toISOString() : "Unknown date"}`
      )
      .join("\n");
    console.log("\nUpcoming Events:\n" + upcoming);
  }

  if (resume) {
    console.log("\nAI Resume (Danish):\n" + resume);
  }

  console.log("\nDone.");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
