import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Add rate limit information to error response
    if (
      error.code === "TOO_MANY_REQUESTS" ||
      error.code === "INTERNAL_SERVER_ERROR"
    ) {
      const message = error.message || "";
      if (message.includes("rate limit") || message.includes("429")) {
        // Try to extract retry-after from message or error data
        const retryAfterMatch = message.match(/retry after ([^,]+)/i);
        const retryAfter = retryAfterMatch?.[1] || (error as any).retryAfter;

        if (retryAfter) {
          return {
            ...shape,
            data: {
              ...shape.data,
              code: "RATE_LIMIT_EXCEEDED",
              retryAfter:
                retryAfter instanceof Date
                  ? retryAfter.toISOString()
                  : retryAfter,
            },
          };
        }
      }
    }

    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
