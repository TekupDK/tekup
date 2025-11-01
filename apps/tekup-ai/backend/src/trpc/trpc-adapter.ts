/**
 * tRPC Express Adapter
 * 
 * Creates Express middleware for tRPC.
 * Integrates with NestJS and Passport JWT authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { TrpcService } from './trpc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

/**
 * Create tRPC Express middleware
 * This middleware handles tRPC requests and integrates with NestJS auth
 */
export function createTrpcMiddleware(trpcService: TrpcService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only handle requests to /trpc path
    if (!req.path.startsWith('/trpc')) {
      return next();
    }

    // Authenticate request using JWT (same as other endpoints)
    const jwtGuard = new JwtAuthGuard(new (class {
      getAllAndOverride() {
        return false; // Not public
      }
    })());

    const context: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getClass: () => class {},
      getHandler: () => ({} as any),
      getArgs: () => [req, res, next],
      getArgByIndex: (index: number) => {
        if (index === 0) return req;
        if (index === 1) return res;
        return next;
      },
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getType: () => 'http' as any,
    };

    // Check authentication
    try {
      await jwtGuard.canActivate(context);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create context for tRPC
    const trpcContext = await trpcService.createContext(req);

    // Handle tRPC request
    const handler = fetchRequestHandler({
      endpoint: '/trpc',
      req: req as any,
      router: trpcService.appRouter,
      createContext: () => Promise.resolve(trpcContext),
    });

    return handler;
  };
}
