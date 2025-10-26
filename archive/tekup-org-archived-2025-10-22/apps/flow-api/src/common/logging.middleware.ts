import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-common-loggi');

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    (req as any).reqId = (req.headers['x-request-id'] as string) || randomUUID();
    res.setHeader('x-request-id', (req as any).reqId);
    const tenant = (req as any).tenantId;
    res.on('finish', () => {
      const durMs = Number(process.hrtime.bigint() - start) / 1e6;
      // eslint-disable-next-line no-console
      logger.info(JSON.stringify({
        ts: new Date().toISOString(),
        level: 'info',
        msg: 'http_request',
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration_ms: Math.round(durMs * 100) / 100,
        tenant_id: tenant,
        req_id: (req as any).reqId
      }));
    });
    next();
  }
}