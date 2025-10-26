# Critical Security Implementation Guide

**Priority:** IMMEDIATE (Next 7 days)  
**Risk Level:** HIGH  
**Business Impact:** Data Breach Prevention  

## 1. AI Agent Tenant Validation Implementation

### Problem
The voice agent service lacks strict tenant validation, potentially allowing cross-tenant data access.

### Solution
Implement comprehensive tenant validation in all AI agent services.

### Implementation Steps

#### Step 1: Update Voice Integration Service
```typescript:apps/voice-agent/src/services/voice-integration.service.ts
// ... existing code ...

export class VoiceIntegrationService {
  private apiClient: ReturnType<typeof createApiClient>;
  private config: VoiceIntegrationConfig;
  private readonly allowedTenants: Set<string>;

  constructor(config: VoiceIntegrationConfig) {
    this.config = config;
    this.allowedTenants = new Set([config.tenantId]); // Only allow assigned tenant
    
    this.apiClient = createApiClient({
      baseUrl: config.flowApiUrl,
      apiKey: config.apiKey,
      tenantId: config.tenantId,
    });
  }

  /**
   * Validate tenant access before executing any command
   */
  private validateTenantAccess(tenantId: string, operation: string): void {
    if (!tenantId || !this.allowedTenants.has(tenantId)) {
      throw new Error(`Access denied: Cannot access tenant ${tenantId} for operation ${operation}`);
    }
    
    // Additional validation: ensure operation is allowed for this tenant
    if (!this.isOperationAllowed(operation, tenantId)) {
      throw new Error(`Operation ${operation} not allowed for tenant ${tenantId}`);
    }
  }

  /**
   * Check if operation is allowed for the specified tenant
   */
  private isOperationAllowed(operation: string, tenantId: string): boolean {
    // Define tenant-specific operation permissions
    const tenantPermissions: Record<string, string[]> = {
      [this.config.tenantId]: [
        'create_lead',
        'get_leads', 
        'search_leads',
        'get_metrics',
        'start_backup',
        'compliance_check'
      ]
    };

    return tenantPermissions[tenantId]?.includes(operation) || false;
  }

  /**
   * Execute a voice command with strict tenant validation
   */
  async executeVoiceCommand(
    command: VoiceCommand,
    parameters?: Record<string, any>
  ): Promise<VoiceResponse> {
    try {
      // Extract tenant from command or use default
      const targetTenant = parameters?.tenantId || this.config.tenantId;
      
      // Validate tenant access
      this.validateTenantAccess(targetTenant, command.name);
      
      console.log(`🎯 Executing voice command: ${command.name} for tenant: ${targetTenant}`, { parameters });

      // ... existing command execution logic ...
      
      // Ensure all API calls use the validated tenant
      const result = await this.executeCommandForTenant(command, targetTenant, parameters);
      
      const response: VoiceResponse = {
        success: true,
        data: result,
        error: undefined,
        tenant: targetTenant, // Use validated tenant
        timestamp: new Date(),
      };

      console.log(`✅ Voice command executed successfully for tenant: ${targetTenant}`);
      return response;

    } catch (err) {
      console.error(`❌ Voice command execution failed:`, err);
      
      const response: VoiceResponse = {
        success: false,
        data: undefined,
        error: err instanceof Error ? err.message : 'Unknown error',
        tenant: this.config.tenantId, // Fallback to assigned tenant
        timestamp: new Date(),
      };

      return response;
    }
  }

  /**
   * Execute command with tenant-specific API client
   */
  private async executeCommandForTenant(
    command: VoiceCommand, 
    tenantId: string, 
    parameters?: Record<string, any>
  ): Promise<any> {
    // Create tenant-specific API client for this operation
    const tenantApiClient = createApiClient({
      baseUrl: this.config.flowApiUrl,
      apiKey: this.config.apiKey,
      tenantId: tenantId,
    });

    // ... existing command execution logic with tenantApiClient ...
  }
}
```

#### Step 2: Add Tenant Validation Decorator
```typescript:apps/voice-agent/src/decorators/tenant-validation.decorator.ts
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const ValidateTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.body?.tenantId;
    
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID required');
    }
    
    // Validate tenant format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
      throw new UnauthorizedException('Invalid tenant ID format');
    }
    
    return tenantId;
  },
);
```

#### Step 3: Update Voice Agent API Routes
```typescript:apps/voice-agent/src/app/api/voice/route.ts
import { ValidateTenant } from '@/decorators/tenant-validation.decorator';

export async function POST(request: Request) {
  try {
    const { command, parameters, tenantId } = await request.json();
    
    // Validate tenant access
    const voiceService = new VoiceIntegrationService({
      flowApiUrl: process.env.FLOW_API_URL!,
      apiKey: process.env.API_KEY!,
      tenantId: tenantId,
    });
    
    // Execute command with tenant validation
    const result = await voiceService.executeVoiceCommand(command, parameters);
    
    return Response.json(result);
  } catch (error) {
    console.error('Voice command error:', error);
    return Response.json(
      { error: 'Command execution failed', details: error.message },
      { status: 400 }
    );
  }
}
```

## 2. Cross-Tenant Access Controls Implementation

### Problem
Missing controls for cross-tenant operations, potentially allowing unauthorized access across business boundaries.

### Solution
Implement comprehensive scope validation and cross-tenant access controls.

### Implementation Steps

#### Step 1: Update Scopes Constants
```typescript:apps/flow-api/src/auth/scopes.constants.ts
// ... existing code ...

// Cross-Tenant Operation Scopes
export const SCOPE_CROSS_TENANT_READ = 'cross_tenant:read';
export const SCOPE_CROSS_TENANT_WRITE = 'cross_tenant:write';
export const SCOPE_CROSS_TENANT_ADMIN = 'cross_tenant:admin';

// Business-Specific Scopes
export const SCOPE_FOODTRUCK_ACCESS = 'business:foodtruck';
export const SCOPE_ESSENZA_ACCESS = 'business:essenza';
export const SCOPE_RENDETALJE_ACCESS = 'business:rendetalje';
export const SCOPE_TEKUP_ADMIN = 'business:tekup_admin';

// Update scope categories
export const SCOPE_CATEGORIES = {
  // ... existing categories ...
  CROSS_TENANT: [SCOPE_CROSS_TENANT_READ, SCOPE_CROSS_TENANT_WRITE, SCOPE_CROSS_TENANT_ADMIN],
  BUSINESS: [SCOPE_FOODTRUCK_ACCESS, SCOPE_ESSENZA_ACCESS, SCOPE_RENDETALJE_ACCESS, SCOPE_TEKUP_ADMIN],
} as const;

// Update all scopes array
export const ALL_SCOPES = [
  // ... existing scopes ...
  SCOPE_CROSS_TENANT_READ,
  SCOPE_CROSS_TENANT_WRITE,
  SCOPE_CROSS_TENANT_ADMIN,
  SCOPE_FOODTRUCK_ACCESS,
  SCOPE_ESSENZA_ACCESS,
  SCOPE_RENDETALJE_ACCESS,
  SCOPE_TEKUP_ADMIN,
] as const;
```

#### Step 2: Enhanced Scopes Guard
```typescript:apps/flow-api/src/auth/scopes.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SCOPES_KEY } from './scopes.decorator.js';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = (request as any).tenantId;
    const apiKeyScopes: string[] = (request as any).apiKeyScopes || [];
    
    if (!tenantId) {
      throw new UnauthorizedException({
        error: 'missing_api_key_context',
        message: 'API key validation must occur before scope validation'
      });
    }

    // Check for admin scope (superuser)
    const hasAdminScope = apiKeyScopes.includes('admin');
    if (hasAdminScope) {
      return true;
    }

    // Validate cross-tenant access
    if (this.requiresCrossTenantAccess(requiredScopes)) {
      if (!this.hasCrossTenantPermission(apiKeyScopes, requiredScopes)) {
        throw new ForbiddenException({
          error: 'insufficient_cross_tenant_permissions',
          message: 'Cross-tenant operations require specific permissions',
          required: requiredScopes,
          provided: apiKeyScopes
        });
      }
    }

    // Validate business-specific access
    if (this.requiresBusinessAccess(requiredScopes)) {
      if (!this.hasBusinessPermission(apiKeyScopes, requiredScopes, tenantId)) {
        throw new ForbiddenException({
          error: 'insufficient_business_permissions',
          message: 'Business-specific operations require appropriate permissions',
          required: requiredScopes,
          provided: apiKeyScopes
        });
      }
    }

    // Check if API key has any of the required scopes
    const hasRequiredScope = requiredScopes.some(scope => apiKeyScopes.includes(scope));
    
    if (!hasRequiredScope) {
      throw new ForbiddenException({
        error: 'insufficient_scopes',
        message: 'API key lacks required scopes for this operation',
        required: requiredScopes,
        provided: apiKeyScopes
      });
    }
    
    return true;
  }

  /**
   * Check if operation requires cross-tenant access
   */
  private requiresCrossTenantAccess(requiredScopes: string[]): boolean {
    return requiredScopes.some(scope => scope.startsWith('cross_tenant:'));
  }

  /**
   * Check if operation requires business-specific access
   */
  private requiresBusinessAccess(requiredScopes: string[]): boolean {
    return requiredScopes.some(scope => scope.startsWith('business:'));
  }

  /**
   * Validate cross-tenant permissions
   */
  private hasCrossTenantPermission(apiKeyScopes: string[], requiredScopes: string[]): boolean {
    const crossTenantScopes = requiredScopes.filter(scope => scope.startsWith('cross_tenant:'));
    
    return crossTenantScopes.every(scope => {
      if (scope === 'cross_tenant:admin') {
        return apiKeyScopes.includes('cross_tenant:admin');
      }
      if (scope === 'cross_tenant:write') {
        return apiKeyScopes.includes('cross_tenant:write') || apiKeyScopes.includes('cross_tenant:admin');
      }
      if (scope === 'cross_tenant:read') {
        return apiKeyScopes.includes('cross_tenant:read') || 
               apiKeyScopes.includes('cross_tenant:write') || 
               apiKeyScopes.includes('cross_tenant:admin');
      }
      return false;
    });
  }

  /**
   * Validate business-specific permissions
   */
  private hasBusinessPermission(apiKeyScopes: string[], requiredScopes: string[], tenantId: string): boolean {
    const businessScopes = requiredScopes.filter(scope => scope.startsWith('business:'));
    
    // Map tenant IDs to business scopes
    const tenantBusinessMap: Record<string, string> = {
      'foodtruck-tenant-id': 'business:foodtruck',
      'essenza-tenant-id': 'business:essenza',
      'rendetalje-tenant-id': 'business:rendetalje',
      'tekup-admin-tenant-id': 'business:tekup_admin',
    };

    const requiredBusinessScope = tenantBusinessMap[tenantId];
    if (!requiredBusinessScope) {
      return false;
    }

    return businessScopes.every(scope => {
      // Allow access if scope matches tenant's business or is tekup_admin
      return scope === requiredBusinessScope || scope === 'business:tekup_admin';
    });
  }
}
```

#### Step 3: Add Cross-Tenant Scope Decorator
```typescript:apps/flow-api/src/auth/cross-tenant.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CROSS_TENANT_KEY = 'cross_tenant_required';
export const BUSINESS_ACCESS_KEY = 'business_access_required';

export const RequireCrossTenant = (scopes: string[]) => SetMetadata(CROSS_TENANT_KEY, scopes);
export const RequireBusinessAccess = (businesses: string[]) => SetMetadata(BUSINESS_ACCESS_KEY, businesses);
```

#### Step 4: Update API Endpoints
```typescript:apps/flow-api/src/lead/lead.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireCrossTenant, RequireBusinessAccess } from '../auth/cross-tenant.decorator';
import { SCOPE_CROSS_TENANT_READ, SCOPE_FOODTRUCK_ACCESS } from '../auth/scopes.constants';

@Controller('leads')
@UseGuards(ApiKeyGuard, ScopesGuard)
export class LeadController {
  
  // Regular tenant-scoped endpoint
  @Get()
  @RequireScopes([SCOPE_READ_LEADS])
  async getLeads() {
    // Standard tenant isolation via RLS
  }

  // Cross-tenant analytics endpoint (admin only)
  @Get('analytics/cross-tenant')
  @RequireCrossTenant([SCOPE_CROSS_TENANT_READ])
  @RequireBusinessAccess(['tekup_admin'])
  async getCrossTenantAnalytics() {
    // Requires cross-tenant permissions
  }

  // Business-specific endpoint
  @Get('foodtruck/special')
  @RequireBusinessAccess([SCOPE_FOODTRUCK_ACCESS])
  async getFoodtruckSpecialLeads() {
    // Only accessible by Foodtruck Fiesta users
  }
}
```

## 3. GDPR Compliance Framework Implementation

### Problem
Missing customer consent management, data retention policies, and GDPR compliance features.

### Solution
Implement comprehensive GDPR compliance framework.

### Implementation Steps

#### Step 1: Add GDPR Models to Database Schema
```sql:apps/flow-api/prisma/migrations/20241201_gdpr_compliance/migration.sql
-- GDPR Compliance Tables
CREATE TABLE "CustomerConsent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "customerId" UUID NOT NULL,
  "consentType" TEXT NOT NULL, -- 'marketing', 'data_processing', 'third_party'
  "consentGiven" BOOLEAN NOT NULL,
  "consentDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "consentWithdrawn" TIMESTAMP WITH TIME ZONE,
  "consentVersion" TEXT NOT NULL,
  "legalBasis" TEXT NOT NULL, -- 'consent', 'legitimate_interest', 'contract'
  "dataUsage" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "DataRetentionPolicy" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "dataType" TEXT NOT NULL, -- 'leads', 'customer_data', 'financial_records'
  "retentionPeriod" INTERVAL NOT NULL,
  "retentionReason" TEXT NOT NULL,
  "autoDelete" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "DataSubjectRequest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "customerId" UUID NOT NULL,
  "requestType" TEXT NOT NULL, -- 'access', 'erasure', 'portability', 'rectification'
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  "requestedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "responseData" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "CustomerConsent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataRetentionPolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataSubjectRequest" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_isolation_customerconsent" ON "CustomerConsent"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_dataretentionpolicy" ON "DataRetentionPolicy"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation_datasubjectrequest" ON "DataSubjectRequest"
  USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);

-- Indexes
CREATE INDEX "idx_customerconsent_tenantid" ON "CustomerConsent"("tenantId");
CREATE INDEX "idx_customerconsent_customerid" ON "CustomerConsent"("customerId");
CREATE INDEX "idx_dataretentionpolicy_tenantid" ON "DataRetentionPolicy"("tenantId");
CREATE INDEX "idx_datasubjectrequest_tenantid" ON "DataSubjectRequest"("tenantId");
CREATE INDEX "idx_datasubjectrequest_status" ON "DataSubjectRequest"("status");
```

#### Step 2: Create GDPR Service
```typescript:apps/flow-api/src/gdpr/gdpr.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface ConsentRequest {
  customerId: string;
  consentType: string;
  consentGiven: boolean;
  legalBasis: string;
  dataUsage?: Record<string, any>;
}

export interface DataSubjectRequest {
  customerId: string;
  requestType: 'access' | 'erasure' | 'portability' | 'rectification';
  notes?: string;
}

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Record customer consent
   */
  async recordConsent(tenantId: string, consent: ConsentRequest): Promise<void> {
    try {
      await this.prisma.customerConsent.create({
        data: {
          tenantId,
          customerId: consent.customerId,
          consentType: consent.consentType,
          consentGiven: consent.consentGiven,
          consentDate: new Date(),
          consentVersion: this.getConsentVersion(),
          legalBasis: consent.legalBasis,
          dataUsage: consent.dataUsage,
        },
      });

      this.logger.log(`Consent recorded for customer ${consent.customerId} in tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to record consent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Withdraw customer consent
   */
  async withdrawConsent(tenantId: string, customerId: string, consentType: string): Promise<void> {
    try {
      await this.prisma.customerConsent.updateMany({
        where: {
          tenantId,
          customerId,
          consentType,
          consentWithdrawn: null,
        },
        data: {
          consentWithdrawn: new Date(),
        },
      });

      this.logger.log(`Consent withdrawn for customer ${customerId} in tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to withdraw consent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process data subject request
   */
  async processDataSubjectRequest(tenantId: string, request: DataSubjectRequest): Promise<string> {
    try {
      const dataSubjectRequest = await this.prisma.dataSubjectRequest.create({
        data: {
          tenantId,
          customerId: request.customerId,
          requestType: request.requestType,
          status: 'processing',
          notes: request.notes,
        },
      });

      // Process request based on type
      switch (request.requestType) {
        case 'access':
          await this.processAccessRequest(tenantId, request.customerId, dataSubjectRequest.id);
          break;
        case 'erasure':
          await this.processErasureRequest(tenantId, request.customerId, dataSubjectRequest.id);
          break;
        case 'portability':
          await this.processPortabilityRequest(tenantId, request.customerId, dataSubjectRequest.id);
          break;
        case 'rectification':
          await this.processRectificationRequest(tenantId, request.customerId, dataSubjectRequest.id);
          break;
      }

      return dataSubjectRequest.id;
    } catch (error) {
      this.logger.error(`Failed to process data subject request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process access request (right to know)
   */
  private async processAccessRequest(tenantId: string, customerId: string, requestId: string): Promise<void> {
    // Collect all data about the customer
    const customerData = await this.collectCustomerData(tenantId, customerId);
    
    // Update request with response data
    await this.prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        responseData: customerData,
      },
    });
  }

  /**
   * Process erasure request (right to be forgotten)
   */
  private async processErasureRequest(tenantId: string, customerId: string, requestId: string): Promise<void> {
    // Check if erasure is legally allowed
    if (!this.canErasureBeProcessed(tenantId, customerId)) {
      await this.prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          completedAt: new Date(),
          notes: 'Erasure not legally permitted due to regulatory requirements',
        },
      });
      return;
    }

    // Anonymize customer data
    await this.anonymizeCustomerData(tenantId, customerId);
    
    // Update request status
    await this.prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Collect all customer data for access request
   */
  private async collectCustomerData(tenantId: string, customerId: string): Promise<Record<string, any>> {
    const [leads, consent, settings] = await Promise.all([
      this.prisma.lead.findMany({
        where: { tenantId, id: customerId },
      }),
      this.prisma.customerConsent.findMany({
        where: { tenantId, customerId },
      }),
      this.prisma.tenantSetting.findMany({
        where: { tenantId },
      }),
    ]);

    return {
      leads,
      consent,
      settings,
      collectedAt: new Date(),
    };
  }

  /**
   * Check if erasure can be legally processed
   */
  private async canErasureBeProcessed(tenantId: string, customerId: string): Promise<boolean> {
    // Check for regulatory requirements that prevent erasure
    const hasRegulatoryData = await this.prisma.lead.findFirst({
      where: {
        tenantId,
        id: customerId,
        complianceType: { not: null },
      },
    });

    return !hasRegulatoryData;
  }

  /**
   * Anonymize customer data
   */
  private async anonymizeCustomerData(tenantId: string, customerId: string): Promise<void> {
    await this.prisma.lead.updateMany({
      where: { tenantId, id: customerId },
      data: {
        payload: { customerData: 'ANONYMIZED' },
        source: 'ANONYMIZED',
      },
    });
  }

  /**
   * Get current consent version
   */
  private getConsentVersion(): string {
    return this.configService.get('CONSENT_VERSION') || '1.0.0';
  }
}
```

#### Step 3: Create GDPR Controller
```typescript:apps/flow-api/src/gdpr/gdpr.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { SCOPE_ADMIN, SCOPE_MANAGE_LEADS } from '../auth/scopes.constants';
import { GdprService, ConsentRequest, DataSubjectRequest } from './gdpr.service';

@Controller('gdpr')
@UseGuards(ApiKeyGuard, ScopesGuard)
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  @Post('consent')
  @RequireScopes([SCOPE_MANAGE_LEADS])
  async recordConsent(
    @Body() consent: ConsentRequest,
    @Request() req: any,
  ) {
    return this.gdprService.recordConsent(req.tenantId, consent);
  }

  @Post('consent/withdraw')
  @RequireScopes([SCOPE_MANAGE_LEADS])
  async withdrawConsent(
    @Body() body: { customerId: string; consentType: string },
    @Request() req: any,
  ) {
    return this.gdprService.withdrawConsent(req.tenantId, body.customerId, body.consentType);
  }

  @Post('data-subject-request')
  @RequireScopes([SCOPE_ADMIN])
  async processDataSubjectRequest(
    @Body() request: DataSubjectRequest,
    @Request() req: any,
  ) {
    return this.gdprService.processDataSubjectRequest(req.tenantId, request);
  }

  @Get('data-subject-request/:requestId')
  @RequireScopes([SCOPE_ADMIN])
  async getDataSubjectRequest(
    @Param('requestId') requestId: string,
    @Request() req: any,
  ) {
    // Implementation to retrieve request status
  }
}
```

## 4. Testing and Validation

### Unit Tests
```typescript:apps/flow-api/src/auth/__tests__/scopes.guard.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ScopesGuard } from '../scopes.guard';
import { Reflector } from '@nestjs/core';

describe('ScopesGuard', () => {
  let guard: ScopesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScopesGuard, Reflector],
    }).compile();

    guard = module.get<ScopesGuard>(ScopesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access for admin scope', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'test-tenant',
          apiKeyScopes: ['admin'],
        }),
      }),
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read:leads']);

    expect(guard.canActivate(mockContext as any)).toBe(true);
  });

  it('should deny cross-tenant access without proper permissions', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'test-tenant',
          apiKeyScopes: ['read:leads'],
        }),
      }),
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['cross_tenant:read']);

    expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
  });
});
```

### Integration Tests
```typescript:apps/flow-api/test/tenant-isolation.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should prevent cross-tenant data access', async () => {
    // Create API keys for different tenants
    const tenant1Key = 'tenant1-api-key';
    const tenant2Key = 'tenant2-api-key';

    // Create data in tenant 1
    await request(app.getHttpServer())
      .post('/leads')
      .set('x-tenant-key', tenant1Key)
      .send({ source: 'test', payload: { test: 'data' } })
      .expect(201);

    // Attempt to access tenant 1 data with tenant 2 key
    await request(app.getHttpServer())
      .get('/leads')
      .set('x-tenant-key', tenant2Key)
      .expect(200)
      .then(response => {
        expect(response.body).toHaveLength(0); // Should see no data
      });
  });

  it('should enforce cross-tenant scope requirements', async () => {
    const regularKey = 'regular-api-key';
    const crossTenantKey = 'cross-tenant-api-key';

    // Attempt cross-tenant operation with insufficient permissions
    await request(app.getHttpServer())
      .get('/leads/analytics/cross-tenant')
      .set('x-tenant-key', regularKey)
      .expect(403);

    // Cross-tenant operation with proper permissions
    await request(app.getHttpServer())
      .get('/leads/analytics/cross-tenant')
      .set('x-tenant-key', crossTenantKey)
      .expect(200);
  });
});
```

## 5. Deployment and Monitoring

### Environment Variables
```bash
# Add to .env file
CONSENT_VERSION=1.0.0
GDPR_ENABLED=true
DATA_RETENTION_ENABLED=true
CROSS_TENANT_ACCESS_ENABLED=true
```

### Monitoring Alerts
```typescript:apps/flow-api/src/monitoring/gdpr-monitoring.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class GdprMonitoringService {
  private readonly logger = new Logger(GdprMonitoringService.name);

  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Monitor GDPR compliance metrics
   */
  monitorGdprCompliance(tenantId: string, operation: string, success: boolean): void {
    this.metricsService.increment('gdpr_operation_total', {
      tenant: tenantId,
      operation,
      success: success.toString(),
    });

    if (!success) {
      this.logger.warn(`GDPR operation failed: ${operation} for tenant ${tenantId}`);
      
      // Alert security team
      this.alertSecurityTeam({
        type: 'gdpr_compliance_failure',
        tenant: tenantId,
        operation,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Alert security team for compliance issues
   */
  private alertSecurityTeam(alert: any): void {
    // Implementation for security team notification
    this.logger.error('GDPR Compliance Alert:', alert);
  }
}
```

## Implementation Timeline

| Task | Duration | Dependencies | Owner |
|------|----------|--------------|-------|
| AI Agent Tenant Validation | 2 days | None | Development Team |
| Cross-Tenant Access Controls | 3 days | AI Agent Validation | Security Team |
| GDPR Compliance Framework | 4 days | None | Compliance Team |
| Testing & Validation | 2 days | All implementations | QA Team |
| Deployment | 1 day | Testing completion | DevOps Team |

**Total Implementation Time: 7-8 days**

## Success Criteria

- [ ] All AI agent calls validate tenant access
- [ ] Cross-tenant operations require proper scopes
- [ ] GDPR compliance features are functional
- [ ] No cross-tenant data leakage possible
- [ ] All security tests pass
- [ ] Monitoring and alerting are active

## Next Steps

1. **Immediate (Day 1-2):** Implement AI agent tenant validation
2. **Short-term (Day 3-5):** Implement cross-tenant access controls
3. **Medium-term (Day 6-8):** Implement GDPR compliance framework
4. **Ongoing:** Continuous monitoring and security improvements

---

*This implementation guide should be followed exactly to ensure security compliance and prevent data breaches.*