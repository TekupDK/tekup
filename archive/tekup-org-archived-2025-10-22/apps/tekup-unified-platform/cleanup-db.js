#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function cleanupDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db',
      },
    },
  });

  try {
    await prisma.$connect();
    console.log('🗄️  Connected to database');

    // Check current state
    const leads = await prisma.lead.findMany({
      select: { id: true, name: true, email: true, tenantId: true }
    });
    console.log('📊 Current leads:', leads.length);
    leads.forEach(lead => {
      console.log(`  - ${lead.name} (${lead.email}) - Tenant: ${lead.tenantId}`);
    });

    // Clean up all test data
    console.log('\n🧹 Cleaning up test data...');
    
    await prisma.leadQualification.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.deal.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.flowRun.deleteMany({});
    await prisma.flow.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    console.log('✅ Database cleaned up successfully');

    // Verify cleanup
    const remainingLeads = await prisma.lead.count();
    console.log(`📊 Remaining leads: ${remainingLeads}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDatabase().catch(console.error);
