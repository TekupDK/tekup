export interface isTenantAware {
  initializeTenant(tenant: string): Promise<void>;
  switchTenant(newTenant: string, userId: string): Promise<void>;
  getCurrentTenant(): string;
  getTenantSettings(): any; // Replace 'any' with a strong type, e.g., TenantSettings
}