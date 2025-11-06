import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    console.log("[Context] Cookies received:", opts.req.headers.cookie);
    user = await sdk.authenticateRequest(opts.req);
    console.log("[Context] User authenticated:", user ? user.name : "null");
  } catch (error) {
    console.log("[Context] Authentication failed:", (error as Error).message);
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
