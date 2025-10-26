export interface isTenantAware {
    initializeTenant(tenant: string): Promise<void>;
    switchTenant(newTenant: string, userId: string): Promise<void>;
    getCurrentTenant(): string;
    getTenantSettings(): any;
}
//# sourceMappingURL=tenant-aware.interface.d.ts.map