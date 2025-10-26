export const isAuthenticated = (token?: string) => Boolean(token && token.length > 10);

// Re-export JWT guard from CRM API
export { JwtAuthGuard } from '../../../apps/tekup-crm-api/src/common/guards/jwt-auth.guard';
