#!/usr/bin/env node

// Simple test script for Lead Platform functionality
const { PrismaClient } = require('@prisma/client');

async function testLeadPlatform() {
  console.log('🧪 Testing Lead Platform functionality...\n');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db',
      },
    },
  });

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Create a test tenant
    const tenant = await prisma.tenant.upsert({
      where: { domain: 'test.tekup.dk' },
      update: {},
      create: {
        name: 'Test Tenant',
        domain: 'test.tekup.dk',
        settings: '{}',
        active: true,
      },
    });
    console.log('✅ Test tenant created:', tenant.id);

    // Test Lead CRUD operations
    console.log('\n📝 Testing Lead CRUD operations...');

    // Create a lead
    const lead = await prisma.lead.create({
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+45 12345678',
        company: 'Test Company',
        source: 'website',
        status: 'new',
        score: 75,
        notes: 'Interested in our services',
        customData: JSON.stringify({ priority: 'high' }),
        tenantId: tenant.id,
      },
    });
    console.log('✅ Lead created:', lead.id);

    // Read the lead
    const retrievedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
    });
    console.log('✅ Lead retrieved:', retrievedLead.name);

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'qualified',
        score: 85,
        qualifiedAt: new Date(),
      },
    });
    console.log('✅ Lead updated:', updatedLead.status);

    // Create a lead qualification
    const qualification = await prisma.leadQualification.create({
      data: {
        leadId: lead.id,
        criteria: 'Budget verification',
        result: 'Confirmed budget available',
        score: 90,
        notes: 'Customer has confirmed budget for Q1',
      },
    });
    console.log('✅ Lead qualification created:', qualification.id);

    // Test lead conversion
    const customer = await prisma.customer.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        tags: '[]',
        customData: '{}',
        status: 'active',
        tenantId: tenant.id,
      },
    });
    console.log('✅ Customer created from lead:', customer.id);

    // Update lead as converted
    const convertedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        conversionType: 'customer',
      },
    });
    console.log('✅ Lead converted:', convertedLead.status);

    // Test analytics queries
    console.log('\n📊 Testing analytics...');

    const leadCount = await prisma.lead.count({
      where: { tenantId: tenant.id },
    });
    console.log('✅ Total leads:', leadCount);

    const qualifiedLeads = await prisma.lead.count({
      where: { 
        tenantId: tenant.id,
        status: 'qualified',
      },
    });
    console.log('✅ Qualified leads:', qualifiedLeads);

    const convertedLeads = await prisma.lead.count({
      where: { 
        tenantId: tenant.id,
        status: 'converted',
      },
    });
    console.log('✅ Converted leads:', convertedLeads);

    const conversionRate = leadCount > 0 ? (convertedLeads / leadCount * 100).toFixed(2) : 0;
    console.log('✅ Conversion rate:', conversionRate + '%');

    // Test lead scoring
    const leadsWithScores = await prisma.lead.findMany({
      where: { 
        tenantId: tenant.id,
        score: { not: null },
      },
      select: { id: true, name: true, score: true },
    });
    console.log('✅ Leads with scores:', leadsWithScores.length);

    // Test source analytics
    const sourceAnalytics = await prisma.lead.groupBy({
      by: ['source'],
      where: { tenantId: tenant.id },
      _count: { _all: true },
    });
    console.log('✅ Source analytics:', sourceAnalytics);

    console.log('\n🎉 All Lead Platform tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Tenant: ${tenant.name} (${tenant.domain})`);
    console.log(`- Leads: ${leadCount} total, ${qualifiedLeads} qualified, ${convertedLeads} converted`);
    console.log(`- Conversion Rate: ${conversionRate}%`);
    console.log(`- Customer created: ${customer.name}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🗄️  Database disconnected');
  }
}

// Run the test
testLeadPlatform().catch(console.error);