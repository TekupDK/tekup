/**
 * Central scope definitions for Project X API
 * All API endpoints must use scopes defined in this file
 */

// Settings Management Scopes
export const SCOPE_MANAGE_SETTINGS = 'manage:settings';
export const SCOPE_READ_SETTINGS = 'read:settings';

// Lead Management Scopes
export const SCOPE_MANAGE_LEADS = 'manage:leads';
export const SCOPE_READ_LEADS = 'read:leads';
export const SCOPE_CREATE_LEADS = 'create:leads';
export const SCOPE_UPDATE_LEADS = 'update:leads';

// Metrics & Observability Scopes
export const SCOPE_READ_METRICS = 'read:metrics';
export const SCOPE_READ_HEALTH = 'read:health';

// Ingestion Scopes
export const SCOPE_INGEST_FORMS = 'ingest:forms';
export const SCOPE_INGEST_EMAIL = 'ingest:email';

// Administrative Scopes
export const SCOPE_ADMIN = 'admin';
export const SCOPE_AUDIT_READ = 'audit:read';

// Cross-Tenant Operation Scopes
export const SCOPE_CROSS_TENANT_READ = 'cross_tenant:read';
export const SCOPE_CROSS_TENANT_WRITE = 'cross_tenant:write';
export const SCOPE_CROSS_TENANT_ADMIN = 'cross_tenant:admin';

// Business-Specific Scopes
export const SCOPE_FOODTRUCK_ACCESS = 'business:foodtruck';
export const SCOPE_ESSENZA_ACCESS = 'business:essenza';
export const SCOPE_RENDETALJE_ACCESS = 'business:rendetalje';
export const SCOPE_TEKUP_ADMIN = 'business:tekup_admin';

/**
 * Scope categories for documentation and validation
 */
export const SCOPE_CATEGORIES = {
  SETTINGS: [SCOPE_MANAGE_SETTINGS, SCOPE_READ_SETTINGS],
  LEADS: [SCOPE_MANAGE_LEADS, SCOPE_READ_LEADS, SCOPE_CREATE_LEADS, SCOPE_UPDATE_LEADS],
  OBSERVABILITY: [SCOPE_READ_METRICS, SCOPE_READ_HEALTH],
  INGESTION: [SCOPE_INGEST_FORMS, SCOPE_INGEST_EMAIL],
  ADMIN: [SCOPE_ADMIN, SCOPE_AUDIT_READ],
  CROSS_TENANT: [SCOPE_CROSS_TENANT_READ, SCOPE_CROSS_TENANT_WRITE, SCOPE_CROSS_TENANT_ADMIN],
  BUSINESS: [SCOPE_FOODTRUCK_ACCESS, SCOPE_ESSENZA_ACCESS, SCOPE_RENDETALJE_ACCESS, SCOPE_TEKUP_ADMIN],
} as const;

/**
 * All valid scopes in the system
 */
export const ALL_SCOPES = [
  SCOPE_MANAGE_SETTINGS,
  SCOPE_READ_SETTINGS,
  SCOPE_MANAGE_LEADS,
  SCOPE_READ_LEADS,
  SCOPE_CREATE_LEADS,
  SCOPE_UPDATE_LEADS,
  SCOPE_READ_METRICS,
  SCOPE_READ_HEALTH,
  SCOPE_INGEST_FORMS,
  SCOPE_INGEST_EMAIL,
  SCOPE_ADMIN,
  SCOPE_AUDIT_READ,
  SCOPE_CROSS_TENANT_READ,
  SCOPE_CROSS_TENANT_WRITE,
  SCOPE_CROSS_TENANT_ADMIN,
  SCOPE_FOODTRUCK_ACCESS,
  SCOPE_ESSENZA_ACCESS,
  SCOPE_RENDETALJE_ACCESS,
  SCOPE_TEKUP_ADMIN,
] as const;

/**
 * Scope descriptions for documentation
 */
export const SCOPE_DESCRIPTIONS: Record<string, string> = {
  [SCOPE_MANAGE_SETTINGS]: 'Update tenant settings (branding, lead handling, etc.)',
  [SCOPE_READ_SETTINGS]: 'Read tenant settings',
  [SCOPE_MANAGE_LEADS]: 'Full lead management (create, read, update, delete)',
  [SCOPE_READ_LEADS]: 'Read leads and lead events',
  [SCOPE_CREATE_LEADS]: 'Create new leads via ingestion',
  [SCOPE_UPDATE_LEADS]: 'Update lead status and properties',
  [SCOPE_READ_METRICS]: 'Access metrics endpoint for monitoring',
  [SCOPE_READ_HEALTH]: 'Access health check endpoints',
  [SCOPE_INGEST_FORMS]: 'Submit leads via form ingestion endpoint',
  [SCOPE_INGEST_EMAIL]: 'Process email-based lead ingestion',
  [SCOPE_ADMIN]: 'Full administrative access (implies all other scopes)',
  [SCOPE_AUDIT_READ]: 'Read audit logs and settings events',
  [SCOPE_CROSS_TENANT_READ]: 'Read data across multiple tenants (admin only)',
  [SCOPE_CROSS_TENANT_WRITE]: 'Write data across multiple tenants (admin only)',
  [SCOPE_CROSS_TENANT_ADMIN]: 'Full cross-tenant administrative access',
  [SCOPE_FOODTRUCK_ACCESS]: 'Access Foodtruck Fiesta business data',
  [SCOPE_ESSENZA_ACCESS]: 'Access Essenza Perfume business data',
  [SCOPE_RENDETALJE_ACCESS]: 'Access Rendetalje business data',
  [SCOPE_TEKUP_ADMIN]: 'Access TekUp admin functions across all businesses',
};

/**
 * Validate if a scope is valid
 */
export function isValidScope(scope: string): boolean {
  return ALL_SCOPES.includes(scope as any);
}

/**
 * Get scopes for a given category
 */
export function getScopesByCategory(category: keyof typeof SCOPE_CATEGORIES): readonly string[] {
  return SCOPE_CATEGORIES[category];
}
