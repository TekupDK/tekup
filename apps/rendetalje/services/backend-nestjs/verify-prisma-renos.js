#!/usr/bin/env node
const { PrismaClient } = require("@prisma/client");

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║     Prisma Verification (renos schema)                   ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

(async () => {
  const prisma = new PrismaClient();
  try {
    const customers = await prisma.renosCustomer.count();
    const leads = await prisma.renosLead.count();
    const bookings = await prisma.renosBooking.count().catch(() => -1);
    const users = await prisma.renosUser.count().catch(() => -1);
    const team = await prisma.renosTeamMember.count().catch(() => -1);
    const timeEntries = await prisma.renosTimeEntry.count().catch(() => -1);

    console.log("customers:", customers);
    console.log("leads:", leads);
    console.log("bookings:", bookings);
    console.log("users:", users);
    console.log("team_members:", team);
    console.log("time_entries:", timeEntries);
  } catch (e) {
    console.error("❌ Verification failed:", e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
