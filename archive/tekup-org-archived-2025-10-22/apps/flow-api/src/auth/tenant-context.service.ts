import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Safely set the tenant context using parameterized queries to prevent SQL injection
   * @param tenantId The tenant ID to set in the session context
   */
  async setTenantContext(tenantId: string): Promise<void> {
    // Validate tenant ID format before execution
    if (!this.isValidTenantId(tenantId)) {
      throw new Error('Invalid tenant ID provided');
    }

    try {
      // Use parameterized query to prevent SQL injection
      await this.prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, false)`;
      this.logger.debug(`Successfully set tenant context for tenant: ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to set tenant context for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Validate tenant ID format
   * @param tenantId The tenant ID to validate
   * @returns boolean indicating if the tenant ID is valid
   */
  isValidTenantId(tenantId: string): boolean {
    // Basic validation - tenant ID should be a non-empty string
    // In a real implementation, this might check against a UUID format or database lookup
    return typeof tenantId === 'string' && tenantId.length > 0 && tenantId.length <= 36;
  }
}