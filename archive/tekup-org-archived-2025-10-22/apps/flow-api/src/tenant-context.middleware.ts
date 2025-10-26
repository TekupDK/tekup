import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { runWithContext, setContext } from '@tekup/observability';
import { PrismaService } from './prisma/prisma.service';
import { randomUUID } from 'crypto';

/**
 * Derives tenant id from header (X-Tenant-Id) or JWT claims (TODO) and sets:
 * - AsyncLocalStorage context
 * - PostgreSQL session variable app.tenant_id for Prisma middleware
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const auth = req.headers['authorization'];
    let tenantId = (req.headers['x-tenant-id'] as string) || undefined;
    let safeJwtDecode: (t:string)=>any = (t)=>({});
    try {
      // dynamic require to avoid build-time missing module crash if not present yet
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      // @ts-ignore
      const jwtLib = require('jsonwebtoken');
      // @ts-ignore
      safeJwtDecode = (token: string) => jwtLib.decode(token) || {};
    } catch {}

    if (!tenantId && auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      try {
        const decoded: any = safeJwtDecode(token);
        tenantId = decoded?.tenant_id || decoded?.tenantId || decoded?.tid || tenantId;
      } catch {}
    }

    // Wrap the rest of the request lifecycle in ALS context
    runWithContext({ requestId, tenantId, traceId: requestId }, async () => {
      try {
        if (tenantId) {
          // Set session variable for this connection (best-effort)
          try {
            await this.prisma.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, tenantId);
          } catch (e) {
            // swallow: connection pool might not yet be tied to this request
          }
        }
        // Expose helper on response locals
        (res.locals as any).tenantId = tenantId;
        next();
      } finally {
        // Optional cleanup or logging could go here
      }
    });
  }
}
