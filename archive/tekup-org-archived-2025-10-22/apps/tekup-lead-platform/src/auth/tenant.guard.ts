import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(/* private prisma: PrismaService */) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantKey = request.headers['x-tenant-key'];

    // For development/testing - allow any tenant key
    const defaultTenantId = tenantKey || 'test-tenant';
    
    // Add tenant info to request
    request.tenant = { id: defaultTenantId, name: 'Test Tenant' };
    request.tenantId = defaultTenantId;

    return true;
    
    // TODO: Implement proper validation once Prisma is working
    /*
    if (!tenantKey) {
      throw new UnauthorizedException('Missing tenant API key');
    }

    try {
      // Validate API key and get tenant
      const apiKey = await this.prisma.apiKey.findFirst({
        where: {
          hashedKey: tenantKey, // In production, this should be hashed
          active: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: { tenant: true }
      });

      if (!apiKey) {
        throw new UnauthorizedException('Invalid or expired tenant API key');
      }

      // Add tenant info to request
      request.tenant = apiKey.tenant;
      request.tenantId = apiKey.tenantId;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Tenant authentication failed');
    }
    */
  }
}
