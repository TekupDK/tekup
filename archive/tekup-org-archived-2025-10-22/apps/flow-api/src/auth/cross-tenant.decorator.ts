import { SetMetadata } from '@nestjs/common';

export const CROSS_TENANT_KEY = 'cross_tenant_required';
export const BUSINESS_ACCESS_KEY = 'business_access_required';

/**
 * Decorator to require cross-tenant permissions
 * @param scopes Array of cross-tenant scopes required
 */
export const RequireCrossTenant = (scopes: string[]) => SetMetadata(CROSS_TENANT_KEY, scopes);

/**
 * Decorator to require business-specific access
 * @param businesses Array of business identifiers required
 */
export const RequireBusinessAccess = (businesses: string[]) => SetMetadata(BUSINESS_ACCESS_KEY, businesses);

/**
 * Decorator for Foodtruck Fiesta specific access
 */
export const RequireFoodtruckAccess = () => SetMetadata(BUSINESS_ACCESS_KEY, ['foodtruck']);

/**
 * Decorator for Essenza Perfume specific access
 */
export const RequireEssenzaAccess = () => SetMetadata(BUSINESS_ACCESS_KEY, ['essenza']);

/**
 * Decorator for Rendetalje specific access
 */
export const RequireRendetaljeAccess = () => SetMetadata(BUSINESS_ACCESS_KEY, ['rendetalje']);

/**
 * Decorator for TekUp admin access
 */
export const RequireTekupAdmin = () => SetMetadata(BUSINESS_ACCESS_KEY, ['tekup_admin']);