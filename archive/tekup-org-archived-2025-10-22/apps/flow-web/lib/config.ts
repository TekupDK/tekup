// Central web client config helper
// Built-time populated via next.config.mjs (env injection) and limited to safe public values.
export const webConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || process.env.FLOW_API_URL || 'http://localhost:4000',
  tenantDevKey: process.env.NEXT_PUBLIC_TENANT_API_KEY || process.env.FLOW_API_KEY || ''
} as const;

export function getApiBase() { return webConfig.apiBaseUrl; }
export function getDevTenantKey() { return webConfig.tenantDevKey; }
