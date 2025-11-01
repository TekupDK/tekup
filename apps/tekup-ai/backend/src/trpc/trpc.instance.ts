/**
 * tRPC Instance
 * 
 * Creates the base tRPC instance with context and error handling.
 * Matches Tekup AI patterns for authentication and error handling.
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './trpc.context';

// Re-export TRPCError for use in routers
export { TRPCError } from '@trpc/server';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.code,
        httpStatus: getHTTPStatusCodeFromError(error),
      },
    };
  },
});

/**
 * Helper function to get HTTP status code from tRPC error
 */
function getHTTPStatusCodeFromError(error: TRPCError): number {
  switch (error.code) {
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'BAD_REQUEST':
      return 400;
    case 'INTERNAL_SERVER_ERROR':
      return 500;
    default:
      return 500;
  }
}

/**
 * Base router and procedure builders
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // Now guaranteed to be defined
    },
  });
});
