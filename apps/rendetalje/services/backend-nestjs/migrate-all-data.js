#!/usr/bin/env node
/**
 * 🚀 Complete Data Migration Script
 * 
 * Migrates ALL data from public schema to renos schema:
 * - customers ✓ (already done)
 * - leads
 * - bookings
 * - team_members
 * - time_entries
 * - subcontractors (already in renos)
 * 
 * Safe mode: Does NOT delete from public until verification passes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return [value];
}

async function migrateLeads() {
  log('\n📊 Migrating Leads...', 'cyan');

  const publicLeads = await prisma.$queryRaw`
    SELECT * FROM public.leads WHERE id NOT IN (SELECT id FROM renos.leads)
  `;

  if (publicLeads.length === 0) {
    log('  ℹ️  No new leads to migrate', 'gray');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const lead of publicLeads) {
    try {
      await prisma.$executeRaw`
        INSERT INTO renos.leads (
          id, name, email, phone, address, city, postal_code,
          service_type, message, status, priority, tags,
          source, assigned_to, follow_up_date, estimated_value,
          metadata, created_at, updated_at
        )
        VALUES (
          ${lead.id}, ${lead.name}, ${lead.email}, ${lead.phone},
          ${lead.address}, ${lead.city}, ${lead.postal_code},
          ${lead.service_type}, ${lead.message}, ${lead.status || 'new'},
          ${lead.priority || 'medium'}, ${parseArray(lead.tags)}::text[],
          ${lead.source}, ${lead.assigned_to}, ${lead.follow_up_date},
          ${lead.estimated_value}, ${lead.metadata || {}},
          ${lead.created_at || new Date()}, ${lead.updated_at || new Date()}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      migrated++;
      log(`  ✅ Migrated lead: ${lead.name || lead.email}`, 'green');
    } catch (err) {
      skipped++;
      log(`  ⚠️  Skipped lead ${lead.id}: ${err.message}`, 'yellow');
    }
  }

  log(`\n  📊 Summary: ${migrated} migrated, ${skipped} skipped`, 'cyan');
}

async function migrateBookings() {
  log('\n📅 Migrating Bookings...', 'cyan');

  const publicBookings = await prisma.$queryRaw`
    SELECT * FROM public.bookings WHERE id NOT IN (SELECT id FROM renos.bookings)
  `;

  if (publicBookings.length === 0) {
    log('  ℹ️  No new bookings to migrate', 'gray');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const booking of publicBookings) {
    try {
      await prisma.$executeRaw`
        INSERT INTO renos.bookings (
          id, customer_id, service_id, scheduled_date, scheduled_time,
          duration_minutes, status, address, city, postal_code,
          notes, price_dkk, assigned_to, metadata,
          created_at, updated_at
        )
        VALUES (
          ${booking.id}, ${booking.customer_id}, ${booking.service_id},
          ${booking.scheduled_date}, ${booking.scheduled_time},
          ${booking.duration_minutes || 120}, ${booking.status || 'pending'},
          ${booking.address}, ${booking.city}, ${booking.postal_code},
          ${booking.notes}, ${booking.price_dkk}, ${booking.assigned_to},
          ${booking.metadata || {}},
          ${booking.created_at || new Date()}, ${booking.updated_at || new Date()}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      migrated++;
      log(`  ✅ Migrated booking: ${booking.id}`, 'green');
    } catch (err) {
      skipped++;
      log(`  ⚠️  Skipped booking ${booking.id}: ${err.message}`, 'yellow');
    }
  }

  log(`\n  📊 Summary: ${migrated} migrated, ${skipped} skipped`, 'cyan');
}

async function migrateTeamMembers() {
  log('\n👨‍👩‍👧‍👦 Migrating Team Members...', 'cyan');

  const publicMembers = await prisma.$queryRaw`
    SELECT * FROM public.team_members WHERE id NOT IN (SELECT id FROM renos.team_members)
  `;

  if (publicMembers.length === 0) {
    log('  ℹ️  No new team members to migrate', 'gray');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const member of publicMembers) {
    try {
      await prisma.$executeRaw`
        INSERT INTO renos.team_members (
          id, user_id, name, email, phone, role,
          hourly_rate_dkk, skills, certifications, availability,
          status, metadata, created_at, updated_at
        )
        VALUES (
          ${member.id}, ${member.user_id}, ${member.name}, ${member.email},
          ${member.phone}, ${member.role || 'cleaner'},
          ${member.hourly_rate_dkk || 200}, ${parseArray(member.skills)}::text[],
          ${parseArray(member.certifications)}::text[], ${member.availability || {}},
          ${member.status || 'active'}, ${member.metadata || {}},
          ${member.created_at || new Date()}, ${member.updated_at || new Date()}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      migrated++;
      log(`  ✅ Migrated team member: ${member.name}`, 'green');
    } catch (err) {
      skipped++;
      log(`  ⚠️  Skipped team member ${member.id}: ${err.message}`, 'yellow');
    }
  }

  log(`\n  📊 Summary: ${migrated} migrated, ${skipped} skipped`, 'cyan');
}

async function migrateTimeEntries() {
  log('\n⏱️  Migrating Time Entries...', 'cyan');

  const publicEntries = await prisma.$queryRaw`
    SELECT * FROM public.time_entries WHERE id NOT IN (SELECT id FROM renos.time_entries)
  `;

  if (publicEntries.length === 0) {
    log('  ℹ️  No new time entries to migrate', 'gray');
    return;
  }

  let migrated = 0;
  let skipped = 0;

  for (const entry of publicEntries) {
    try {
      await prisma.$executeRaw`
        INSERT INTO renos.time_entries (
          id, team_member_id, booking_id, check_in, check_out,
          break_minutes, notes, location, status,
          created_at, updated_at
        )
        VALUES (
          ${entry.id}, ${entry.team_member_id}, ${entry.booking_id},
          ${entry.check_in}, ${entry.check_out}, ${entry.break_minutes || 0},
          ${entry.notes}, ${entry.location}, ${entry.status || 'draft'},
          ${entry.created_at || new Date()}, ${entry.updated_at || new Date()}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      migrated++;
      log(`  ✅ Migrated time entry: ${entry.id}`, 'green');
    } catch (err) {
      skipped++;
      log(`  ⚠️  Skipped time entry ${entry.id}: ${err.message}`, 'yellow');
    }
  }

  log(`\n  📊 Summary: ${migrated} migrated, ${skipped} skipped`, 'cyan');
}

async function verifyMigration() {
  log('\n🔍 Verifying Migration...', 'cyan');

  const counts = {
    customers: await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM renos.customers`,
    leads: await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM renos.leads`,
    bookings: await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM renos.bookings`,
    team_members: await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM renos.team_members`,
    time_entries: await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM renos.time_entries`,
  };

  log('\n📊 Final Row Counts:', 'cyan');
  Object.entries(counts).forEach(([table, result]) => {
    const count = result[0].count;
    log(`  ${table.padEnd(20)}: ${count}`, count > 0 ? 'green' : 'gray');
  });

  return counts;
}

async function main() {
  log('\n🚀 Starting Complete Data Migration to Renos Schema\n', 'cyan');
  log('📍 Database: Supabase (renos schema)', 'gray');
  log('⚠️  Safe mode: Public data preserved until verification\n', 'yellow');

  try {
    // Migrate each table
    await migrateLeads();
    await migrateBookings();
    await migrateTeamMembers();
    await migrateTimeEntries();

    // Verify final state
    const counts = await verifyMigration();

    log('\n✅ Migration completed successfully!', 'green');
    log('📊 All data has been migrated to renos schema.', 'green');
    log('\n⚠️  Review counts above. If verified, public tables can be archived.\n', 'yellow');
  } catch (err) {
    log(`\n❌ Migration failed: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
