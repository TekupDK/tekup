const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data for Tekup Unified Platform...');

  try {
    // Create test tenant
    let tenant;
    try {
      tenant = await prisma.tenant.upsert({
        where: { domain: 'test-tenant.tekup.dk' },
        update: {},
        create: {
          id: 'test-tenant',
          name: 'Test Tenant',
          domain: 'test-tenant.tekup.dk',
          settings: JSON.stringify({
            leadScoring: {
              emailWeight: 20,
              phoneWeight: 30,
              companyWeight: 20,
              referralBonus: 20,
              websiteBonus: 10
            },
            features: {
              aiInsights: true,
              autoScoring: true,
              leadQualification: true
            }
          }),
          active: true
        }
      });
      console.log('✅ Test tenant created:', tenant.name);
    } catch (error) {
      console.log('ℹ️ Test tenant already exists, skipping...');
      tenant = await prisma.tenant.findUnique({
        where: { domain: 'test-tenant.tekup.dk' }
      });
    }

    // Create test user
    let testUser;
    try {
      testUser = await prisma.user.upsert({
        where: { email: 'test@tekup.dk' },
        update: {},
        create: {
          email: 'test@tekup.dk',
          name: 'Test User',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          roles: JSON.stringify(['admin', 'user']),
          tenantId: tenant.id,
          active: true
        }
      });
      console.log('✅ Test user created:', testUser.email);
    } catch (error) {
      console.log('ℹ️ Test user already exists, skipping...');
    }

    // Create sample leads
    const sampleLeads = [
      {
        name: 'Lars Nielsen',
        email: 'lars@nielsen.dk',
        phone: '+45 12 34 56 78',
        company: 'Nielsen Consulting',
        source: 'website',
        status: 'new',
        notes: 'Interested in CRM solution for small business',
        customData: JSON.stringify({
          industry: 'consulting',
          employees: '5-10',
          budget: 'medium'
        }),
        tenantId: tenant.id
      },
      {
        name: 'Maria Jensen',
        email: 'maria@techstartup.dk',
        phone: '+45 87 65 43 21',
        company: 'TechStartup ApS',
        source: 'referral',
        status: 'contacted',
        score: 75,
        notes: 'Referred by existing customer. High potential.',
        customData: JSON.stringify({
          industry: 'technology',
          employees: '20-50',
          budget: 'high',
          referredBy: 'existing-customer-id'
        }),
        tenantId: tenant.id
      },
      {
        name: 'Peter Andersen',
        email: 'peter@retail.dk',
        phone: '+45 11 22 33 44',
        company: 'Retail Solutions',
        source: 'social',
        status: 'qualified',
        score: 60,
        qualifiedAt: new Date('2024-01-15'),
        notes: 'Qualified lead, needs follow-up next week',
        customData: JSON.stringify({
          industry: 'retail',
          employees: '10-20',
          budget: 'medium'
        }),
        tenantId: tenant.id
      },
      {
        name: 'Sophie Hansen',
        email: 'sophie@converted.dk',
        phone: '+45 55 66 77 88',
        company: 'Converted Company',
        source: 'website',
        status: 'converted',
        score: 85,
        qualifiedAt: new Date('2024-01-10'),
        convertedAt: new Date('2024-01-20'),
        conversionType: 'customer',
        notes: 'Successfully converted to customer. Great experience.',
        customData: JSON.stringify({
          industry: 'manufacturing',
          employees: '50-100',
          budget: 'high'
        }),
        tenantId: tenant.id
      }
    ];

    console.log('🚀 Creating sample leads...');
    for (const leadData of sampleLeads) {
      try {
        const lead = await prisma.lead.upsert({
          where: { 
            email_tenantId: {
              email: leadData.email,
              tenantId: leadData.tenantId
            }
          },
          update: leadData,
          create: leadData
        });
        console.log(`✅ Created lead: ${lead.name} (${lead.email})`);

        // Create sample qualifications for qualified/converted leads
        if (leadData.status === 'qualified' || leadData.status === 'converted') {
          await prisma.leadQualification.upsert({
            where: { id: `qual-${lead.id}` },
            update: {},
            create: {
              id: `qual-${lead.id}`,
              leadId: lead.id,
              criteria: 'Budget Assessment',
              result: 'Has sufficient budget for enterprise solution',
              score: 25,
              notes: 'Confirmed budget range during qualification call'
            }
          });

          await prisma.leadQualification.upsert({
            where: { id: `qual2-${lead.id}` },
            update: {},
            create: {
              id: `qual2-${lead.id}`,
              leadId: lead.id,
              criteria: 'Decision Authority',
              result: 'Contact is key decision maker',
              score: 30,
              notes: 'CEO/Owner of the company, makes final decisions'
            }
          });
        }

        // Create customer from converted lead
        if (leadData.status === 'converted') {
          await prisma.customer.upsert({
            where: {
              email_tenantId: {
                email: leadData.email,
                tenantId: leadData.tenantId
              }
            },
            update: {},
            create: {
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone,
              company: leadData.company,
              tags: JSON.stringify(['converted-lead', 'high-value']),
              customData: leadData.customData,
              status: 'active',
              tenantId: leadData.tenantId
            }
          });
          console.log(`✅ Created customer from lead: ${leadData.name}`);
        }

      } catch (error) {
        console.log(`ℹ️ Lead ${leadData.name} already exists, skipping...`);
      }
    }

    console.log('🎉 Test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    
    const leadCounts = await prisma.lead.groupBy({
      by: ['status'],
      where: { tenantId: tenant.id },
      _count: { _all: true }
    });
    
    console.log('Lead counts by status:');
    leadCounts.forEach(({ status, _count }) => {
      console.log(`  - ${status}: ${_count._all}`);
    });

    const totalCustomers = await prisma.customer.count({
      where: { tenantId: tenant.id }
    });
    console.log(`  - Total customers: ${totalCustomers}`);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
