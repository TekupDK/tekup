#!/usr/bin/env ts-node
/**
 * Database Relations Fix Tool
 * 
 * Purpose: Fix orphaned leads/bookings and update customer stats
 * Phase: Phase 0 - Validation
 * Priority: CRITICAL (blocks Customer 360)
 * 
 * What it does:
 * 1. Links orphaned leads to customers by email matching
 * 2. Links orphaned bookings to customers via their leads
 * 3. Recalculates totalLeads and totalBookings for all customers
 * 4. Creates missing customers from orphaned leads if needed
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

const prisma = new PrismaClient();

interface FixResult {
  leadsLinked: number;
  bookingsLinked: number;
  customersCreated: number;
  statsUpdated: number;
  errors: string[];
}

async function fixDatabaseRelations(dryRun: boolean = true): Promise<FixResult> {
  const mode = dryRun ? "DRY-RUN" : "LIVE";
  logger.info(`🔧 Starting database relations fix [${mode} MODE]...`);

  const result: FixResult = {
    leadsLinked: 0,
    bookingsLinked: 0,
    customersCreated: 0,
    statsUpdated: 0,
    errors: [],
  };

  try {
    // =========================================================================
    // STEP 1: Link orphaned leads to existing customers by email
    // =========================================================================
    logger.info("\n📧 Step 1: Linking orphaned leads to customers by email...");

    const orphanedLeads = await prisma.lead.findMany({
      where: {
        customerId: null,
        email: { not: null },
      },
    });

    logger.info(`Found ${orphanedLeads.length} orphaned leads with emails`);

    for (const lead of orphanedLeads) {
      if (!lead.email) continue;

      const customer = await prisma.customer.findFirst({
        where: { email: lead.email },
      });

      if (customer) {
        logger.info(`  ✅ Linking lead ${lead.id} (${lead.email}) to customer ${customer.name}`);

        if (!dryRun) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { customerId: customer.id },
          });
        }

        result.leadsLinked++;
      } else {
        logger.info(`  ⚠️ No customer found for lead ${lead.id} (${lead.email}) - will create`);
      }
    }

    // =========================================================================
    // STEP 2: Create customers from orphaned leads without matching customers
    // =========================================================================
    logger.info("\n👤 Step 2: Creating customers from orphaned leads...");

    const stillOrphanedLeads = await prisma.lead.findMany({
      where: { customerId: null },
    });

    logger.info(`Found ${stillOrphanedLeads.length} leads still without customers`);

    for (const lead of stillOrphanedLeads) {
      // Extract name and email from lead
      const customerName = lead.name || `Kunde fra ${lead.email || "lead"}`;
      const customerEmail = lead.email || `noemail_${lead.id}@placeholder.com`;

      logger.info(`  ➕ Creating customer "${customerName}" from lead ${lead.id}`);

      if (!dryRun) {
        const newCustomer = await prisma.customer.create({
          data: {
            name: customerName,
            email: customerEmail,
            phone: lead.phone || null,
            address: lead.address || null,
            totalLeads: 1,
            totalBookings: 0,
          },
        });

        await prisma.lead.update({
          where: { id: lead.id },
          data: { customerId: newCustomer.id },
        });

        result.customersCreated++;
        result.leadsLinked++;
      }
    }

    // =========================================================================
    // STEP 3: Link orphaned bookings to customers via their leads
    // =========================================================================
    logger.info("\n📅 Step 3: Linking orphaned bookings to customers...");

    const orphanedBookings = await prisma.booking.findMany({
      where: { customerId: null },
      include: { lead: true },
    });

    logger.info(`Found ${orphanedBookings.length} orphaned bookings`);

    for (const booking of orphanedBookings) {
      if (booking.lead?.customerId) {
        logger.info(`  ✅ Linking booking ${booking.id} to customer via lead ${booking.leadId}`);

        if (!dryRun) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { customerId: booking.lead.customerId },
          });
        }

        result.bookingsLinked++;
      } else {
        result.errors.push(`Booking ${booking.id} has no lead or lead has no customer`);
      }
    }

    // =========================================================================
    // STEP 4: Recalculate totalLeads and totalBookings for all customers
    // =========================================================================
    logger.info("\n🔢 Step 4: Recalculating customer stats...");

    const customers = await prisma.customer.findMany({
      include: {
        leads: true,
        bookings: true,
      },
    });

    logger.info(`Recalculating stats for ${customers.length} customers`);

    for (const customer of customers) {
      const actualLeads = customer.leads.length;
      const actualBookings = customer.bookings.length;
      const storedLeads = customer.totalLeads || 0;
      const storedBookings = customer.totalBookings || 0;

      if (actualLeads !== storedLeads || actualBookings !== storedBookings) {
        logger.info(
          `  📊 Updating ${customer.name}: ` +
          `${storedLeads} → ${actualLeads} leads, ` +
          `${storedBookings} → ${actualBookings} bookings`
        );

        if (!dryRun) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: {
              totalLeads: actualLeads,
              totalBookings: actualBookings,
            },
          });
        }

        result.statsUpdated++;
      }
    }

    // =========================================================================
    // SUMMARY
    // =========================================================================
    logger.info("\n═══════════════════════════════════");
    logger.info(`📊 FIX SUMMARY [${mode} MODE]:`);
    logger.info("═══════════════════════════════════");
    logger.info(`  Leads linked: ${result.leadsLinked}`);
    logger.info(`  Bookings linked: ${result.bookingsLinked}`);
    logger.info(`  Customers created: ${result.customersCreated}`);
    logger.info(`  Stats updated: ${result.statsUpdated}`);
    logger.info(`  Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      logger.warn("\n⚠️ ERRORS:");
      result.errors.forEach((err) => logger.warn(`  ${err}`));
    }

    if (dryRun) {
      logger.info("\n⚠️ DRY-RUN MODE: No changes were made to the database.");
      logger.info("Run with --live flag to apply changes.");
    } else {
      logger.info("\n✅ LIVE MODE: Changes have been applied to the database!");
    }

    return result;
  } catch (error) {
    console.error("❌ Fix failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--live");

  console.log("\n🔧 RenOS Database Relations Fix Tool");
  console.log("═══════════════════════════════════\n");

  if (dryRun) {
    console.log("⚠️ Running in DRY-RUN mode (no changes will be made)");
    console.log("   Use --live flag to apply changes\n");
  } else {
    console.log("⚠️ Running in LIVE mode - changes will be applied!");
    console.log("   Press Ctrl+C to cancel\n");

    // Give user 3 seconds to cancel
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  try {
    await fixDatabaseRelations(dryRun);

    console.log("\n═══════════════════════════════════");
    console.log("✅ FIX COMPLETE\n");

    if (dryRun) {
      console.log("Run with --live to apply these changes.\n");
    } else {
      console.log("🎉 Database relations have been fixed!");
      console.log("   Run auditDatabaseRelations.ts to verify.\n");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}

export { fixDatabaseRelations };
