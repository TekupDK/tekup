import "dotenv/config";
import { writeFileSync } from "fs";
import type { TrpcContext } from "../_core/context";
import { ENV } from "../_core/env";
import * as db from "../db";
import { appRouter } from "../routers";

async function main() {
  const email = "emilovic99@hotmail.com";
  const displayName = "Emil Lærke";

  if (!ENV.databaseUrl || !ENV.ownerOpenId) {
    console.error("Missing DATABASE_URL or OWNER_OPEN_ID in environment");
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
  if (!user) throw new Error("Failed to create/find owner user");

  const ctx: TrpcContext = {
    req: {} as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
    user,
  };
  const caller = appRouter.createCaller(ctx);

  console.log("🔍 Fetching Emil Lærke profile...\n");

  // Ensure a profile exists (create a lead if needed)
  const leads = await db.getUserLeads(user.id, { searchQuery: email });
  let lead = leads.find(l => l.email?.toLowerCase() === email.toLowerCase());
  if (!lead) {
    const created = await db.createLead({
      userId: user.id,
      source: "analysis_script",
      name: displayName,
      email,
      status: "new",
      score: 0,
      notes: "Created for Emil Lærke analysis",
      company: null,
      phone: null,
      metadata: null,
    } as any);
    lead = created as any;
  }

  // Make sure a customer profile exists for the lead
  await caller.customer.getProfileByLeadId({ leadId: (lead as any).id });

  // Fetch profile with case analysis
  const result = await caller.customer.getProfileWithCase({ email });

  const customer = result.customer as any;
  console.log(`✅ Customer found: ${customer.name || displayName}`);
  console.log(`📍 Address: ${customer.address || "(unknown)"}`);
  console.log(`📧 Bookings: ${(result.calendarEvents || []).length}\n`);

  console.log(`📧 Email threads found: ${result.emailThreads.length}`);
  result.emailThreads.slice(0, 10).forEach((thread: any, i: number) => {
    const subject = thread.subject || thread.snippet || "(no subject)";
    const date = thread.date || "";
    console.log(`${i + 1}. ${date}: ${String(subject).substring(0, 50)}...`);
  });
  console.log();

  const emilEvents = (result.calendarEvents || []).filter(
    (e: any) =>
      (e.description || "").includes("Emil Lærke") ||
      (e.title || "").includes("Emil")
  );
  console.log(`📅 Calendar events (Emil): ${emilEvents.length}`);
  emilEvents.forEach((evt: any) => {
    const start = evt.startTime ? new Date(evt.startTime).toISOString() : "";
    console.log(`• ${start}: ${evt.title || "(No title)"}`);
  });
  console.log();

  console.log("📊 CASE ANALYSIS:\n");
  console.log(JSON.stringify(result.caseAnalysis, null, 2));

  writeFileSync(
    "analysis-emil-laerke.json",
    JSON.stringify(result.caseAnalysis, null, 2)
  );
  console.log("\n✅ Analysis saved to analysis-emil-laerke.json");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
