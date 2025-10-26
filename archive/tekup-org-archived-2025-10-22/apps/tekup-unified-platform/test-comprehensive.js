#!/usr/bin/env node

// Comprehensive test suite for Tekup Unified Platform
const { PrismaClient } = require('@prisma/client');

class PlatformTester {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./dev.db',
        },
      },
    });
    this.testTenant = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    try {
      console.log(`\n🧪 Running: ${testName}`);
      await testFunction();
      this.testResults.passed++;
      this.testResults.details.push({ name: testName, status: 'PASSED' });
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  async setupTestTenant() {
    this.testTenant = await this.prisma.tenant.upsert({
      where: { domain: 'test.tekup.dk' },
      update: {},
      create: {
        name: 'Test Tenant',
        domain: 'test.tekup.dk',
        settings: '{}',
        active: true,
      },
    });
    console.log('🏢 Test tenant setup:', this.testTenant.id);
  }

  async cleanupTestData() {
    // Clean up test data
    await this.prisma.leadQualification.deleteMany({
      where: { lead: { tenantId: this.testTenant.id } }
    });
    await this.prisma.lead.deleteMany({
      where: { tenantId: this.testTenant.id }
    });
    await this.prisma.customer.deleteMany({
      where: { tenantId: this.testTenant.id }
    });
    await this.prisma.deal.deleteMany({
      where: { customer: { tenantId: this.testTenant.id } }
    });
    await this.prisma.activity.deleteMany({
      where: { customer: { tenantId: this.testTenant.id } }
    });
    await this.prisma.flowRun.deleteMany({
      where: { flow: { tenantId: this.testTenant.id } }
    });
    await this.prisma.flow.deleteMany({
      where: { tenantId: this.testTenant.id }
    });
    console.log('🧹 Test data cleaned up');
  }

  // ============================================================================
  // CORE MODULE TESTS
  // ============================================================================

  async testDatabaseConnection() {
    await this.prisma.$connect();
    const tenantCount = await this.prisma.tenant.count();
    if (tenantCount >= 0) {
      console.log('   Database connection successful');
    } else {
      throw new Error('Database connection failed');
    }
  }

  async testTenantIsolation() {
    // Create two tenants
    const tenant1 = await this.prisma.tenant.create({
      data: {
        name: 'Tenant 1',
        domain: 'tenant1.tekup.dk',
        settings: '{}',
        active: true,
      },
    });

    const tenant2 = await this.prisma.tenant.create({
      data: {
        name: 'Tenant 2',
        domain: 'tenant2.tekup.dk',
        settings: '{}',
        active: true,
      },
    });

    // Create leads for each tenant
    const lead1 = await this.prisma.lead.create({
      data: {
        name: 'Lead 1',
        email: 'lead1@example.com',
        tenantId: tenant1.id,
      },
    });

    const lead2 = await this.prisma.lead.create({
      data: {
        name: 'Lead 2',
        email: 'lead2@example.com',
        tenantId: tenant2.id,
      },
    });

    // Verify isolation
    const tenant1Leads = await this.prisma.lead.findMany({
      where: { tenantId: tenant1.id }
    });

    const tenant2Leads = await this.prisma.lead.findMany({
      where: { tenantId: tenant2.id }
    });

    if (tenant1Leads.length !== 1 || tenant2Leads.length !== 1) {
      throw new Error('Tenant isolation failed');
    }

    // Cleanup
    await this.prisma.lead.deleteMany({
      where: { tenantId: { in: [tenant1.id, tenant2.id] } }
    });
    await this.prisma.tenant.deleteMany({
      where: { id: { in: [tenant1.id, tenant2.id] } }
    });

    console.log('   Tenant isolation verified');
  }

  // ============================================================================
  // LEAD PLATFORM TESTS
  // ============================================================================

  async testLeadCRUD() {
    // Create lead
    const lead = await this.prisma.lead.create({
      data: {
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '+45 12345678',
        company: 'Test Company',
        source: 'website',
        status: 'new',
        score: 75,
        notes: 'Test lead',
        customData: JSON.stringify({ priority: 'high' }),
        tenantId: this.testTenant.id,
      },
    });

    // Read lead
    const retrievedLead = await this.prisma.lead.findUnique({
      where: { id: lead.id }
    });

    if (!retrievedLead || retrievedLead.name !== 'Test Lead') {
      throw new Error('Lead creation/retrieval failed');
    }

    // Update lead
    const updatedLead = await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'qualified', score: 85 }
    });

    if (updatedLead.status !== 'qualified' || updatedLead.score !== 85) {
      throw new Error('Lead update failed');
    }

    // Delete lead
    await this.prisma.lead.delete({
      where: { id: lead.id }
    });

    const deletedLead = await this.prisma.lead.findUnique({
      where: { id: lead.id }
    });

    if (deletedLead) {
      throw new Error('Lead deletion failed');
    }

    console.log('   Lead CRUD operations successful');
  }

  async testLeadQualification() {
    // Create lead
    const lead = await this.prisma.lead.create({
      data: {
        name: 'Qualification Test Lead',
        email: 'qual@example.com',
        tenantId: this.testTenant.id,
      },
    });

    // Create qualification
    const qualification = await this.prisma.leadQualification.create({
      data: {
        leadId: lead.id,
        criteria: 'Budget verification',
        result: 'Confirmed',
        score: 90,
        notes: 'Customer has budget',
      },
    });

    // Verify qualification
    const retrievedQual = await this.prisma.leadQualification.findUnique({
      where: { id: qualification.id }
    });

    if (!retrievedQual || retrievedQual.criteria !== 'Budget verification') {
      throw new Error('Lead qualification failed');
    }

    // Cleanup
    await this.prisma.leadQualification.deleteMany({
      where: { leadId: lead.id }
    });
    await this.prisma.lead.delete({
      where: { id: lead.id }
    });

    console.log('   Lead qualification successful');
  }

  async testLeadConversion() {
    // Create lead
    const lead = await this.prisma.lead.create({
      data: {
        name: 'Conversion Test Lead',
        email: 'convert@example.com',
        tenantId: this.testTenant.id,
      },
    });

    // Create customer from lead
    const customer = await this.prisma.customer.create({
      data: {
        name: lead.name,
        email: lead.email,
        tenantId: this.testTenant.id,
      },
    });

    // Update lead as converted
    const convertedLead = await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        conversionType: 'customer',
      },
    });

    if (convertedLead.status !== 'converted' || !convertedLead.convertedAt) {
      throw new Error('Lead conversion failed');
    }

    // Cleanup
    await this.prisma.lead.delete({
      where: { id: lead.id }
    });
    await this.prisma.customer.delete({
      where: { id: customer.id }
    });

    console.log('   Lead conversion successful');
  }

  async testLeadAnalytics() {
    // Create test leads with different statuses
    const leads = await Promise.all([
      this.prisma.lead.create({
        data: {
          name: 'Lead 1',
          email: 'lead1@example.com',
          source: 'website',
          status: 'new',
          score: 60,
          tenantId: this.testTenant.id,
        },
      }),
      this.prisma.lead.create({
        data: {
          name: 'Lead 2',
          email: 'lead2@example.com',
          source: 'referral',
          status: 'qualified',
          score: 80,
          tenantId: this.testTenant.id,
        },
      }),
      this.prisma.lead.create({
        data: {
          name: 'Lead 3',
          email: 'lead3@example.com',
          source: 'website',
          status: 'converted',
          score: 90,
          convertedAt: new Date(),
          tenantId: this.testTenant.id,
        },
      }),
    ]);

    // Test analytics queries
    const totalLeads = await this.prisma.lead.count({
      where: { tenantId: this.testTenant.id }
    });

    const qualifiedLeads = await this.prisma.lead.count({
      where: { 
        tenantId: this.testTenant.id,
        status: 'qualified'
      }
    });

    const convertedLeads = await this.prisma.lead.count({
      where: { 
        tenantId: this.testTenant.id,
        status: 'converted'
      }
    });

    const sourceAnalytics = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { tenantId: this.testTenant.id },
      _count: { _all: true }
    });

    console.log(`   Total leads: ${totalLeads}, Qualified: ${qualifiedLeads}, Converted: ${convertedLeads}`);
    console.log(`   Source analytics: ${sourceAnalytics.length} sources`);

    if (totalLeads !== 3) {
      throw new Error(`Expected 3 total leads, got ${totalLeads}`);
    }

    if (qualifiedLeads !== 1) {
      throw new Error(`Expected 1 qualified lead, got ${qualifiedLeads}`);
    }

    if (convertedLeads !== 1) {
      throw new Error(`Expected 1 converted lead, got ${convertedLeads}`);
    }

    if (sourceAnalytics.length !== 2) {
      throw new Error(`Expected 2 sources, got ${sourceAnalytics.length}`);
    }

    // Cleanup
    await this.prisma.lead.deleteMany({
      where: { tenantId: this.testTenant.id }
    });

    console.log('   Lead analytics successful');
  }

  // ============================================================================
  // CRM MODULE TESTS
  // ============================================================================

  async testCustomerCRUD() {
    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '+45 87654321',
        company: 'Customer Company',
        tenantId: this.testTenant.id,
      },
    });

    // Read customer
    const retrievedCustomer = await this.prisma.customer.findUnique({
      where: { id: customer.id }
    });

    if (!retrievedCustomer || retrievedCustomer.name !== 'Test Customer') {
      throw new Error('Customer creation/retrieval failed');
    }

    // Update customer
    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { status: 'inactive' }
    });

    if (updatedCustomer.status !== 'inactive') {
      throw new Error('Customer update failed');
    }

    // Delete customer
    await this.prisma.customer.delete({
      where: { id: customer.id }
    });

    console.log('   Customer CRUD operations successful');
  }

  async testDealManagement() {
    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        name: 'Deal Customer',
        email: 'deal@example.com',
        tenantId: this.testTenant.id,
      },
    });

    // Create deal
    const deal = await this.prisma.deal.create({
      data: {
        title: 'Test Deal',
        value: 50000,
        currency: 'DKK',
        stage: 'prospect',
        probability: 25,
        expectedCloseDate: new Date('2025-12-31'),
        customerId: customer.id,
      },
    });

    // Update deal
    const updatedDeal = await this.prisma.deal.update({
      where: { id: deal.id },
      data: { stage: 'qualified', probability: 50 }
    });

    if (updatedDeal.stage !== 'qualified' || updatedDeal.probability !== 50) {
      throw new Error('Deal update failed');
    }

    // Cleanup
    await this.prisma.deal.delete({
      where: { id: deal.id }
    });
    await this.prisma.customer.delete({
      where: { id: customer.id }
    });

    console.log('   Deal management successful');
  }

  // ============================================================================
  // FLOW MODULE TESTS
  // ============================================================================

  async testFlowManagement() {
    // Create a test user first (required for foreign key)
    const testUser = await this.prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        tenantId: this.testTenant.id,
      },
    });

    // Create flow
    const flow = await this.prisma.flow.create({
      data: {
        name: 'Test Flow',
        description: 'Test workflow',
        definition: JSON.stringify({ steps: ['start', 'process', 'end'] }),
        tenantId: this.testTenant.id,
        createdBy: testUser.id,
      },
    });

    // Create flow run
    const flowRun = await this.prisma.flowRun.create({
      data: {
        status: 'running',
        input: JSON.stringify({ data: 'test' }),
        flowId: flow.id,
        userId: testUser.id,
      },
    });

    // Update flow run
    const updatedFlowRun = await this.prisma.flowRun.update({
      where: { id: flowRun.id },
      data: { 
        status: 'completed',
        output: JSON.stringify({ result: 'success' }),
        finishedAt: new Date()
      }
    });

    if (updatedFlowRun.status !== 'completed') {
      throw new Error('Flow run update failed');
    }

    // Cleanup
    await this.prisma.flowRun.deleteMany({
      where: { flowId: flow.id }
    });
    await this.prisma.flow.delete({
      where: { id: flow.id }
    });
    await this.prisma.user.delete({
      where: { id: testUser.id }
    });

    console.log('   Flow management successful');
  }

  // ============================================================================
  // VOICE MODULE TESTS
  // ============================================================================

  async testCallManagement() {
    // Create call
    const call = await this.prisma.call.create({
      data: {
        direction: 'inbound',
        fromNumber: '+45 12345678',
        toNumber: '+45 87654321',
        status: 'completed',
        duration: 300,
        transcript: 'Test call transcript',
        cost: 5.50,
        startedAt: new Date(),
        endedAt: new Date(),
        tenantId: this.testTenant.id,
      },
    });

    // Update call
    const updatedCall = await this.prisma.call.update({
      where: { id: call.id },
      data: { status: 'completed' }
    });

    if (updatedCall.status !== 'completed') {
      throw new Error('Call update failed');
    }

    // Cleanup
    await this.prisma.call.delete({
      where: { id: call.id }
    });

    console.log('   Call management successful');
  }

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  async testLeadToCustomerWorkflow() {
    // Create lead
    const lead = await this.prisma.lead.create({
      data: {
        name: 'Workflow Lead',
        email: 'workflow@example.com',
        source: 'website',
        status: 'new',
        tenantId: this.testTenant.id,
      },
    });

    // Qualify lead
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'qualified', qualifiedAt: new Date() }
    });

    // Convert to customer
    const customer = await this.prisma.customer.create({
      data: {
        name: lead.name,
        email: lead.email,
        tenantId: this.testTenant.id,
      },
    });

    // Create deal for customer
    const deal = await this.prisma.deal.create({
      data: {
        title: 'Deal for converted lead',
        value: 25000,
        stage: 'prospect',
        customerId: customer.id,
      },
    });

    // Update lead as converted
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        conversionType: 'customer',
      },
    });

    // Verify workflow
    const convertedLead = await this.prisma.lead.findUnique({
      where: { id: lead.id }
    });

    const customerDeals = await this.prisma.deal.findMany({
      where: { customerId: customer.id }
    });

    if (convertedLead.status !== 'converted' || customerDeals.length !== 1) {
      throw new Error('Lead to customer workflow failed');
    }

    // Cleanup
    await this.prisma.deal.delete({
      where: { id: deal.id }
    });
    await this.prisma.customer.delete({
      where: { id: customer.id }
    });
    await this.prisma.lead.delete({
      where: { id: lead.id }
    });

    console.log('   Lead to customer workflow successful');
  }

  async testMultiTenantDataIsolation() {
    // Clean up any existing leads for both tenants first
    await this.prisma.lead.deleteMany({
      where: { 
        OR: [
          { tenantId: this.testTenant.id },
          { email: { contains: 'isolation' } }
        ]
      }
    });

    // Create another tenant with unique domain
    const otherTenant = await this.prisma.tenant.upsert({
      where: { domain: 'other.tekup.dk' },
      update: {},
      create: {
        name: 'Other Tenant',
        domain: 'other.tekup.dk',
        settings: '{}',
        active: true,
      },
    });

    // Create leads for both tenants
    const lead1 = await this.prisma.lead.create({
      data: {
        name: 'Tenant 1 Lead',
        email: 'tenant1-isolation@example.com',
        tenantId: this.testTenant.id,
      },
    });

    const lead2 = await this.prisma.lead.create({
      data: {
        name: 'Tenant 2 Lead',
        email: 'tenant2-isolation@example.com',
        tenantId: otherTenant.id,
      },
    });

    // Verify isolation
    const tenant1Leads = await this.prisma.lead.findMany({
      where: { tenantId: this.testTenant.id }
    });

    const tenant2Leads = await this.prisma.lead.findMany({
      where: { tenantId: otherTenant.id }
    });

    console.log(`   Tenant 1 leads: ${tenant1Leads.length}, Tenant 2 leads: ${tenant2Leads.length}`);

    if (tenant1Leads.length !== 1) {
      throw new Error(`Expected 1 lead for tenant 1, got ${tenant1Leads.length}`);
    }

    if (tenant2Leads.length !== 1) {
      throw new Error(`Expected 1 lead for tenant 2, got ${tenant2Leads.length}`);
    }

    // Verify cross-tenant access is blocked
    const crossTenantLeads = await this.prisma.lead.findMany({
      where: { 
        tenantId: this.testTenant.id,
        email: 'tenant2-isolation@example.com' // This should not exist in tenant 1
      }
    });

    if (crossTenantLeads.length > 0) {
      throw new Error('Cross-tenant data access detected');
    }

    // Cleanup
    await this.prisma.lead.deleteMany({
      where: { tenantId: { in: [this.testTenant.id, otherTenant.id] } }
    });
    await this.prisma.tenant.delete({
      where: { id: otherTenant.id }
    });

    console.log('   Multi-tenant data isolation successful');
  }

  // ============================================================================
  // MAIN TEST RUNNER
  // ============================================================================

  async runAllTests() {
    console.log('🚀 Starting Tekup Unified Platform Comprehensive Tests\n');
    console.log('=' * 60);

    try {
      await this.setupTestTenant();

      // Core Module Tests
      await this.runTest('Database Connection', () => this.testDatabaseConnection());
      await this.runTest('Tenant Isolation', () => this.testTenantIsolation());

      // Lead Platform Tests
      await this.runTest('Lead CRUD Operations', () => this.testLeadCRUD());
      await this.runTest('Lead Qualification', () => this.testLeadQualification());
      await this.runTest('Lead Conversion', () => this.testLeadConversion());
      await this.runTest('Lead Analytics', () => this.testLeadAnalytics());

      // CRM Module Tests
      await this.runTest('Customer CRUD Operations', () => this.testCustomerCRUD());
      await this.runTest('Deal Management', () => this.testDealManagement());

      // Flow Module Tests
      await this.runTest('Flow Management', () => this.testFlowManagement());

      // Voice Module Tests
      await this.runTest('Call Management', () => this.testCallManagement());

      // Integration Tests
      await this.runTest('Lead to Customer Workflow', () => this.testLeadToCustomerWorkflow());
      await this.runTest('Multi-tenant Data Isolation', () => this.testMultiTenantDataIsolation());

    } catch (error) {
      console.error('❌ Test setup failed:', error.message);
    } finally {
      await this.cleanupTestData();
      await this.prisma.$disconnect();
    }

    // Print results
    console.log('\n' + '=' * 60);
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' * 60);
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    console.log('\n🎉 Test suite completed!');
  }
}

// Run the comprehensive test suite
const tester = new PlatformTester();
tester.runAllTests().catch(console.error);