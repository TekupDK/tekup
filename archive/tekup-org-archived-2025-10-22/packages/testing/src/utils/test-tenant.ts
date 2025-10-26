import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  businessType: 'foodtruck' | 'perfume' | 'construction' | 'cross-business';
  features: string[];
  settings: Record<string, any>;
}

export class TestTenant {
  private prisma: PrismaClient;
  private tenantId: string;

  constructor(prisma: PrismaClient, tenantId: string) {
    this.prisma = prisma;
    this.tenantId = tenantId;
  }

  async createTenant(config: TenantConfig): Promise<void> {
    await this.prisma.tenant.create({
      data: {
        id: config.id,
        slug: config.slug,
        name: config.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create tenant-specific settings
    await this.prisma.tenantSetting.create({
      data: {
        tenantId: config.id,
        key: 'business_type',
        value: config.businessType,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.tenantSetting.create({
      data: {
        tenantId: config.id,
        key: 'features',
        value: config.features,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.prisma.tenantSetting.create({
      data: {
        tenantId: config.id,
        key: 'settings',
        value: config.settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async createTestLeads(count: number = 5): Promise<string[]> {
    const leadIds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const lead = await this.prisma.lead.create({
        data: {
          tenantId: this.tenantId,
          source: faker.helpers.arrayElement(['voice', 'email', 'web', 'mobile']),
          status: faker.helpers.arrayElement(['new', 'contacted', 'qualified', 'converted']),
          payload: this.generateLeadPayload(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      leadIds.push(lead.id);
    }
    
    return leadIds;
  }

  async createTestEvents(leadIds: string[]): Promise<void> {
    for (const leadId of leadIds) {
      await this.prisma.leadEvent.create({
        data: {
          leadId,
          tenantId: this.tenantId,
          type: faker.helpers.arrayElement(['created', 'contacted', 'qualified', 'converted']),
          payload: { timestamp: new Date().toISOString() },
          createdAt: new Date(),
        },
      });
    }
  }

  async setTenantContext(): Promise<void> {
    // Set RLS context for the current tenant
    await this.prisma.$executeRaw`SET LOCAL "app.current_tenant_id" = ${this.tenantId}`;
  }

  async clearTenantContext(): Promise<void> {
    await this.prisma.$executeRaw`RESET "app.current_tenant_id"`;
  }

  private generateLeadPayload(): any {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      company: faker.company.name(),
      message: faker.lorem.sentence(),
      timestamp: new Date().toISOString(),
    };
  }

  getTenantId(): string {
    return this.tenantId;
  }
}

// Predefined tenant configurations for different business types
export const TENANT_CONFIGS = {
  FOODTRUCK_FIESTA: {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'foodtruck-fiesta',
    name: 'Foodtruck Fiesta',
    businessType: 'foodtruck' as const,
    features: ['location_services', 'mobile_ordering', 'payment_processing', 'voice_commands'],
    settings: {
      maxOrderDistance: 5000,
      supportedPaymentMethods: ['card', 'mobile', 'cash'],
      voiceLanguage: 'da',
    },
  },
  
  ESSENZA_PERFUME: {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'essenza-perfume',
    name: 'Essenza Perfume',
    businessType: 'perfume' as const,
    features: ['inventory_management', 'customer_recommendations', 'ecommerce', 'voice_commands'],
    settings: {
      inventoryThreshold: 10,
      recommendationEngine: true,
      voiceLanguage: 'da',
    },
  },
  
  RENDETALJE: {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'rendetalje',
    name: 'Rendetalje Construction',
    businessType: 'construction' as const,
    features: ['project_management', 'customer_communications', 'scheduling', 'voice_commands'],
    settings: {
      projectTracking: true,
      customerPortal: true,
      voiceLanguage: 'da',
    },
  },
  
  CROSS_BUSINESS: {
    id: '44444444-4444-4444-4444-444444444444',
    slug: 'cross-business',
    name: 'Cross Business Analytics',
    businessType: 'cross-business' as const,
    features: ['analytics', 'customer_sync', 'financial_consolidation', 'voice_commands'],
    settings: {
      dataSharing: true,
      unifiedMetrics: true,
      voiceLanguage: 'da',
    },
  },
};

// Factory function for creating test tenants
export function createTestTenant(prisma: PrismaClient, config: TenantConfig): TestTenant {
  return new TestTenant(prisma, config.id);
}