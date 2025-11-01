/**
 * Main tRPC Router
 *
 * Combines all sub-routers into a single app router.
 * This is exported and used in the NestJS tRPC adapter.
 */

import { aiRouter } from "./routers/ai.router";
import { emailRouter } from "./routers/email.router";
import { router } from "./trpc.instance";

export const appRouter = router({
  email: emailRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
