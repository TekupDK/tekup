/**
 * tRPC Context
 * 
 * Creates the context for tRPC requests, including authenticated user.
 * Matches the pattern used in Tekup AI controllers with CurrentUser.
 */

import { Request } from 'express';
import type { PrismaClient } from '@prisma/client';
import { McpService } from '../mcp/mcp.service';
import { AiService } from '../ai/ai.service';

export interface Context {
  req: Request;
  userId?: string;
  userEmail?: string;
  prisma: PrismaClient;
  mcpService?: McpService;
  aiService?: AiService;
}

/**
 * Create tRPC context from Express request
 */
export async function createContext(opts: {
  req: Request;
  prisma: any; // PrismaClient
  mcpService?: McpService;
  aiService?: AiService;
}): Promise<Context> {
  // Extract user from JWT token (handled by Passport)
  // The user should already be attached by JwtStrategy if authenticated
  const user = (opts.req as any).user;
  
  return {
    req: opts.req,
    userId: user?.userId || user?.sub,
    userEmail: user?.email,
    prisma: opts.prisma,
    mcpService: opts.mcpService,
    aiService: opts.aiService,
  };
}
