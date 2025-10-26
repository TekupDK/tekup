import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from '../auth/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

describe('RLS Cross-Tenant Security (e2e)', () => {
  let app: TestingModule;
  let prisma: PrismaService;
  let tenantContext: TenantContextService;
  
  // Test tenant IDs
  const TENANT_A_ID = '11111111-1111-1111-1111-111111111111';
  const TENANT_B_ID = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        PrismaService,
        TenantContextService,
      ],
    }).compile();

    prisma = app.get<PrismaService>(PrismaService);
    tenantContext = app.get<TenantContextService>(TenantContextService);

    // Setup test tenants (bypass RLS for setup)
    await prisma.$executeRaw`SET row_security = off`;
    
    // Clean up existing test data
    await prisma.lead.deleteMany({ where: { tenantId: { in: [TENANT_A_ID, TENANT_B_ID] } } });
    await prisma.tenantSetting.deleteMany({ where: { tenantId: { in: [TENANT_A_ID, TENANT_B_ID] } } });
    await prisma.duplicateGroup.deleteMany({ where: { tenantId: { in: [TENANT_A_ID, TENANT_B_ID] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [TENANT_A_ID, TENANT_B_ID] } } });
    
    // Create test tenants
    await prisma.tenant.createMany({
      data: [
        { id: TENANT_A_ID, slug: 'tenant-a', name: 'Tenant A' },
        { id: TENANT_B_ID, slug: 'tenant-b', name: 'Tenant B' },
      ],
    });

    // Re-enable RLS
    await prisma.$executeRaw`SET row_security = on`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Lead Cross-Tenant Isolation', () => {
    let tenantALeadId: string;
    let tenantBLeadId: string;

    beforeEach(async () => {
      // Setup test data for Tenant A
      await tenantContext.setTenantContext(TENANT_A_ID);
      const leadA = await prisma.lead.create({
        data: {
          tenantId: TENANT_A_ID,
          source: 'test-source-a',
          payload: { test: 'data-a' },
        },
      });
      tenantALeadId = leadA.id;

      // Setup test data for Tenant B
      await tenantContext.setTenantContext(TENANT_B_ID);
      const leadB = await prisma.lead.create({
        data: {
          tenantId: TENANT_B_ID,
          source: 'test-source-b',
          payload: { test: 'data-b' },
        },
      });
      tenantBLeadId = leadB.id;
    });

    afterEach(async () => {
      // Clean up with RLS off
      await prisma.$executeRaw`SET row_security = off`;
      await prisma.leadEvent.deleteMany({});
      await prisma.lead.deleteMany({ where: { tenantId: { in: [TENANT_A_ID, TENANT_B_ID] } } });
      await prisma.$executeRaw`SET row_security = on`;
    });

    it('should only see own tenant leads', async () => {
      // Set context to Tenant A
      await tenantContext.setTenantContext(TENANT_A_ID);
      const tenantALeads = await prisma.lead.findMany();
      
      expect(tenantALeads).toHaveLength(1);
      expect(tenantALeads[0].id).toBe(tenantALeadId);
      expect(tenantALeads[0].tenantId).toBe(TENANT_A_ID);

      // Set context to Tenant B
      await tenantContext.setTenantContext(TENANT_B_ID);
      const tenantBLeads = await prisma.lead.findMany();
      
      expect(tenantBLeads).toHaveLength(1);
      expect(tenantBLeads[0].id).toBe(tenantBLeadId);
      expect(tenantBLeads[0].tenantId).toBe(TENANT_B_ID);
    });

    it('should not be able to access other tenant leads by ID', async () => {
      // Set context to Tenant A and try to access Tenant B's lead
      await tenantContext.setTenantContext(TENANT_A_ID);
      const crossTenantLead = await prisma.lead.findUnique({
        where: { id: tenantBLeadId },
      });
      
      expect(crossTenantLead).toBeNull();
    });

    it('should not be able to update other tenant leads', async () => {
      // Set context to Tenant A and try to update Tenant B's lead
      await tenantContext.setTenantContext(TENANT_A_ID);
      
      await expect(
        prisma.lead.update({
          where: { id: tenantBLeadId },
          data: { source: 'hacked-source' },
        })
      ).rejects.toThrow();
    });
  });

  describe('TenantSetting Cross-Tenant Isolation', () => {
    afterEach(async () => {
      // Clean up with RLS off
      await prisma.$executeRaw`SET row_security = off`;
      await prisma.settingsEvent.deleteMany({});
      await prisma.tenantSetting.deleteMany({ where: { tenantId: { in: [TENANT_A_ID, TENANT_B_ID] } } });
      await prisma.$executeRaw`SET row_security = on`;
    });

    it('should only see own tenant settings', async () => {
      // Create settings for both tenants
      await tenantContext.setTenantContext(TENANT_A_ID);
      await prisma.tenantSetting.create({
        data: {
          tenantId: TENANT_A_ID,
          key: 'test-key-a',
          value: 'test-value-a',
        },
      });

      await tenantContext.setTenantContext(TENANT_B_ID);
      await prisma.tenantSetting.create({
        data: {
          tenantId: TENANT_B_ID,
          key: 'test-key-b',
          value: 'test-value-b',
        },
      });

      // Verify isolation for Tenant A
      await tenantContext.setTenantContext(TENANT_A_ID);
      const tenantASettings = await prisma.tenantSetting.findMany();
      expect(tenantASettings).toHaveLength(1);
      expect(tenantASettings[0].key).toBe('test-key-a');
      expect(tenantASettings[0].tenantId).toBe(TENANT_A_ID);

      // Verify isolation for Tenant B
      await tenantContext.setTenantContext(TENANT_B_ID);
      const tenantBSettings = await prisma.tenantSetting.findMany();
      expect(tenantBSettings).toHaveLength(1);
      expect(tenantBSettings[0].key).toBe('test-key-b');
      expect(tenantBSettings[0].tenantId).toBe(TENANT_B_ID);
    });
  });

  describe('DuplicateGroup Cross-Tenant Isolation', () => {
    afterEach(async () => {
      // Clean up with RLS off
      await prisma.$executeRaw`SET row_security = off`;
      await prisma.duplicateGroupMember.deleteMany({});
      await prisma.duplicateGroup.deleteMany({ where: { tenantId: { in: [TENANT_A_ID, TENANT_B_ID] } } });
      await prisma.$executeRaw`SET row_security = on`;
    });

    it('should only see own tenant duplicate groups', async () => {
      // Create duplicate groups for both tenants
      await tenantContext.setTenantContext(TENANT_A_ID);
      await prisma.duplicateGroup.create({
        data: {
          tenantId: TENANT_A_ID,
          hash: 'hash-a',
          resolved: false,
        },
      });

      await tenantContext.setTenantContext(TENANT_B_ID);
      await prisma.duplicateGroup.create({
        data: {
          tenantId: TENANT_B_ID,
          hash: 'hash-b',
          resolved: false,
        },
      });

      // Verify isolation for Tenant A
      await tenantContext.setTenantContext(TENANT_A_ID);
      const tenantAGroups = await prisma.duplicateGroup.findMany();
      expect(tenantAGroups).toHaveLength(1);
      expect(tenantAGroups[0].hash).toBe('hash-a');
      expect(tenantAGroups[0].tenantId).toBe(TENANT_A_ID);

      // Verify isolation for Tenant B
      await tenantContext.setTenantContext(TENANT_B_ID);
      const tenantBGroups = await prisma.duplicateGroup.findMany();
      expect(tenantBGroups).toHaveLength(1);
      expect(tenantBGroups[0].hash).toBe('hash-b');
      expect(tenantBGroups[0].tenantId).toBe(TENANT_B_ID);
    });
  });

  describe('RLS Policy Validation', () => {
    it('should have RLS enabled on all tenant-related tables', async () => {
      const rlsTables = await prisma.$queryRaw<Array<{tablename: string, rowsecurity: boolean}>>`
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('Tenant', 'Lead', 'LeadEvent', 'ApiKey', 'TenantSetting', 'SettingsEvent', 'DuplicateGroup', 'DuplicateGroupMember')
        ORDER BY tablename;
      `;

      // Verify all tables have RLS enabled
      for (const table of rlsTables) {
        expect(table.rowsecurity).toBe(true);
      }

      // Verify we have all expected tables
      const expectedTables = ['ApiKey', 'DuplicateGroup', 'DuplicateGroupMember', 'Lead', 'LeadEvent', 'SettingsEvent', 'Tenant', 'TenantSetting'];
      const actualTables = rlsTables.map(t => t.tablename).sort();
      expect(actualTables).toEqual(expectedTables);
    });

    it('should have tenant isolation policies for all tables', async () => {
      const policies = await prisma.$queryRaw<Array<{tablename: string, policyname: string}>>`
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE policyname LIKE 'tenant_isolation_%'
        ORDER BY tablename, policyname;
      `;

      // Verify we have policies for all expected tables
      const expectedPolicies = [
        'tenant_isolation_apikey',
        'tenant_isolation_duplicategroup', 
        'tenant_isolation_duplicategroupmember',
        'tenant_isolation_lead',
        'tenant_isolation_leadevent',
        'tenant_isolation_settingsevent',
        'tenant_isolation_tenant',
        'tenant_isolation_tenantsetting',
      ];

      const actualPolicies = policies.map(p => p.policyname).sort();
      expect(actualPolicies).toEqual(expectedPolicies);
    });
  });

  describe('Invalid Tenant Context Handling', () => {
    it('should handle invalid tenant ID gracefully', async () => {
      await expect(tenantContext.setTenantContext('')).rejects.toThrow('Invalid tenant ID provided');
      await expect(tenantContext.setTenantContext('invalid-uuid')).rejects.toThrow('Invalid tenant ID provided');
    });

    it('should return empty results when no tenant context is set', async () => {
      // Reset tenant context (simulate no context)
      await prisma.$executeRaw`SELECT set_config('app.tenant_id', '', false)`;
      
      const leads = await prisma.lead.findMany();
      expect(leads).toHaveLength(0);
    });
  });
});
