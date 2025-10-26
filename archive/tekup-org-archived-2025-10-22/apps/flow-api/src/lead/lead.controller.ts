import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { RequireCrossTenant, RequireBusinessAccess, RequireFoodtruckAccess, RequireEssenzaAccess, RequireRendetaljeAccess, RequireTekupAdmin } from '../auth/cross-tenant.decorator';
import { 
  SCOPE_READ_LEADS, 
  SCOPE_CREATE_LEADS, 
  SCOPE_MANAGE_LEADS,
  SCOPE_CROSS_TENANT_READ,
  SCOPE_FOODTRUCK_ACCESS,
  SCOPE_ESSENZA_ACCESS,
  SCOPE_RENDETALJE_ACCESS,
  SCOPE_TEKUP_ADMIN
} from '../auth/scopes.constants';

@Controller('leads')
@UseGuards(ApiKeyGuard, ScopesGuard)
export class LeadController {
  
  // Regular tenant-scoped endpoint - standard RLS isolation
  @Get()
  @RequireScopes([SCOPE_READ_LEADS])
  async getLeads(@Request() req: any) {
    // Standard tenant isolation via RLS
    // This will only return leads for the authenticated tenant
    return {
      message: 'Leads retrieved for tenant',
      tenantId: req.tenantId,
      count: 0 // Placeholder
    };
  }

  // Create lead endpoint - standard tenant isolation
  @Post()
  @RequireScopes([SCOPE_CREATE_LEADS])
  async createLead(@Body() leadData: any, @Request() req: any) {
    // Lead will be automatically assigned to the authenticated tenant
    return {
      message: 'Lead created for tenant',
      tenantId: req.tenantId,
      leadId: 'new-lead-id' // Placeholder
    };
  }

  // Cross-tenant analytics endpoint (admin only)
  @Get('analytics/cross-tenant')
  @RequireCrossTenant([SCOPE_CROSS_TENANT_READ])
  @RequireBusinessAccess([SCOPE_TEKUP_ADMIN])
  async getCrossTenantAnalytics() {
    // Requires cross-tenant permissions
    // This endpoint can access data across all tenants
    return {
      message: 'Cross-tenant analytics retrieved',
      totalLeads: 0, // Placeholder
      tenantBreakdown: {} // Placeholder
    };
  }

  // Business-specific endpoints for each company
  @Get('foodtruck/special')
  @RequireFoodtruckAccess()
  async getFoodtruckSpecialLeads(@Request() req: any) {
    // Only accessible by Foodtruck Fiesta users
    return {
      message: 'Foodtruck Fiesta special leads',
      tenantId: req.tenantId,
      leads: [] // Placeholder
    };
  }

  @Get('essenza/special')
  @RequireEssenzaAccess()
  async getEssenzaSpecialLeads(@Request() req: any) {
    // Only accessible by Essenza Perfume users
    return {
      message: 'Essenza Perfume special leads',
      tenantId: req.tenantId,
      leads: [] // Placeholder
    };
  }

  @Get('rendetalje/special')
  @RequireRendetaljeAccess()
  async getRendetaljeSpecialLeads(@Request() req: any) {
    // Only accessible by Rendetalje users
    return {
      message: 'Rendetalje special leads',
      tenantId: req.tenantId,
      leads: [] // Placeholder
    };
  }

  // TekUp admin endpoint for cross-business operations
  @Get('admin/cross-business-summary')
  @RequireTekupAdmin()
  async getCrossBusinessSummary() {
    // Only accessible by TekUp admin users
    // Can access summary data across all businesses
    return {
      message: 'Cross-business summary for TekUp admin',
      businessSummary: {
        foodtruck: { leads: 0, revenue: 0 },
        essenza: { leads: 0, revenue: 0 },
        rendetalje: { leads: 0, revenue: 0 }
      }
    };
  }

  // Lead management with business-specific permissions
  @Post('bulk-update')
  @RequireScopes([SCOPE_MANAGE_LEADS])
  @RequireBusinessAccess([SCOPE_FOODTRUCK_ACCESS, SCOPE_ESSENZA_ACCESS, SCOPE_RENDETALJE_ACCESS])
  async bulkUpdateLeads(@Body() updateData: any, @Request() req: any) {
    // Requires lead management scope AND business access
    return {
      message: 'Bulk update completed for business',
      tenantId: req.tenantId,
      updatedCount: 0 // Placeholder
    };
  }

  // Health check endpoint (no special permissions required)
  @Get('health')
  async getHealth() {
    return {
      status: 'healthy',
      service: 'lead-controller',
      timestamp: new Date().toISOString()
    };
  }
}