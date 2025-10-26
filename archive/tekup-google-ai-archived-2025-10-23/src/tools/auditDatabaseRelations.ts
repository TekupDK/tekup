#!/usr/bin/env ts-node
/**
 * Database Relations Audit Tool
 * 
 * Purpose: Diagnose why customers show 0 leads/bookings
 * Phase: Phase 0 - Validation
 * Priority: CRITICAL (blocks Customer 360)
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../logger";

const prisma = new PrismaClient();

interface AuditResult {
  totalCustomers: number;
  totalLeads: number;
  totalBookings: number;
  orphanedLeads: number;
  orphanedBookings: number;
  customersWithIncorrectStats: number;
  issues: string[];
}

async function auditDatabaseRelations(): Promise<AuditResult> {
  logger.info("🔍 Starting database relations audit...");

  const result: AuditResult = {
    totalCustomers: 0,
    totalLeads: 0,
    totalBookings: 0,
    orphanedLeads: 0,
    orphanedBookings: 0,
    customersWithIncorrectStats: 0,
    issues: [],
  };

  try {
    // 1. Count total records
    result.totalCustomers = await prisma.customer.count();
    result.totalLeads = await prisma.lead.count();
    result.totalBookings = await prisma.booking.count();

    logger.info(`📊 Total records: ${result.totalCustomers} customers, ${result.totalLeads} leads, ${result.totalBookings} bookings`);

    // 2. Find orphaned leads (leads without customerId)
    const orphanedLeads = await prisma.lead.findMany({
      where: { customerId: null },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    result.orphanedLeads = orphanedLeads.length;

    if (orphanedLeads.length > 0) {
      result.issues.push(`⚠️ Found ${orphanedLeads.length} orphaned leads without customers`);
      logger.warn(`⚠️ Orphaned leads: ${orphanedLeads.length}`);

      // Show first 5
      orphanedLeads.slice(0, 5).forEach((lead) => {
        logger.info(`  - Lead ${lead.id}: ${lead.name || lead.email} (${lead.createdAt.toISOString()})`);
      });
    }

    // 3. Find orphaned bookings (bookings without customerId)
    const orphanedBookings = await prisma.booking.findMany({
      where: { customerId: null },
      select: { id: true, leadId: true, scheduledAt: true },
    });

    result.orphanedBookings = orphanedBookings.length;

    if (orphanedBookings.length > 0) {
      result.issues.push(`⚠️ Found ${orphanedBookings.length} orphaned bookings without customers`);
      logger.warn(`⚠️ Orphaned bookings: ${orphanedBookings.length}`);

      // Show first 5
      orphanedBookings.slice(0, 5).forEach((booking) => {
        logger.info(`  - Booking ${booking.id}: leadId=${booking.leadId}, scheduled=${booking.scheduledAt.toISOString()}`);
      });
    }

    // 4. Check customer stats accuracy
    const customers = await prisma.customer.findMany({
      include: {
        leads: true,
        bookings: true,
      },
    });

    logger.info("📊 Checking customer stats accuracy...");

    for (const customer of customers) {
      const actualLeads = customer.leads.length;
      const actualBookings = customer.bookings.length;
      const storedLeads = customer.totalLeads || 0;
      const storedBookings = customer.totalBookings || 0;

      if (actualLeads !== storedLeads || actualBookings !== storedBookings) {
        result.customersWithIncorrectStats++;
        result.issues.push(
          `⚠️ Customer "${customer.name}" stats mismatch: ` +
          `stored=${storedLeads} leads/${storedBookings} bookings, ` +
          `actual=${actualLeads} leads/${actualBookings} bookings`
        );

        logger.warn(
          `⚠️ Stats mismatch for ${customer.name}: ` +
          `${storedLeads} → ${actualLeads} leads, ` +
          `${storedBookings} → ${actualBookings} bookings`
        );
      }
    }

    // 5. Check for leads that could be linked to customers by email
    const leadsWithEmail = await prisma.lead.findMany({
      where: {
        customerId: null,
        email: { not: null },
      },
      select: { id: true, email: true, name: true },
    });

    let potentialMatches = 0;

    for (const lead of leadsWithEmail) {
      if (!lead.email) continue;

      const matchingCustomer = await prisma.customer.findFirst({
        where: { email: lead.email },
      });

      if (matchingCustomer) {
        potentialMatches++;
        logger.info(`✅ Can link lead ${lead.id} (${lead.email}) to customer ${matchingCustomer.name}`);
      }
    }

    if (potentialMatches > 0) {
      result.issues.push(`✅ Found ${potentialMatches} leads that can be auto-linked by email`);
    }

    // 6. Summary
    logger.info("\n📊 AUDIT SUMMARY:");
    logger.info(`  Total customers: ${result.totalCustomers}`);
    logger.info(`  Total leads: ${result.totalLeads}`);
    logger.info(`  Total bookings: ${result.totalBookings}`);
    logger.info(`  Orphaned leads: ${result.orphanedLeads}`);
    logger.info(`  Orphaned bookings: ${result.orphanedBookings}`);
    logger.info(`  Customers with incorrect stats: ${result.customersWithIncorrectStats}`);
    logger.info(`  Potential auto-link matches: ${potentialMatches}`);

    if (result.issues.length > 0) {
      logger.warn("\n⚠️ ISSUES FOUND:");
      result.issues.forEach((issue) => logger.warn(`  ${issue}`));
    } else {
      logger.info("\n✅ No issues found - database relations are healthy!");
    }

    return result;
  } catch (error) {
    console.error("❌ Audit failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log("\n🔍 RenOS Database Relations Audit");
  console.log("═══════════════════════════════════\n");

  try {
    const result = await auditDatabaseRelations();

    console.log("\n═══════════════════════════════════");
    console.log("📊 AUDIT COMPLETE\n");

    if (result.issues.length > 0) {
      console.log("⚠️ Issues found. Run fixDatabaseRelations.ts to repair.\n");
      process.exit(1);
    } else {
      console.log("✅ Database relations are healthy!\n");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Audit failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}

export { auditDatabaseRelations };
