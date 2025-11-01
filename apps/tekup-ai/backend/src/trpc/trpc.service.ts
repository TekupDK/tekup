/**
 * tRPC Service
 *
 * Service that provides tRPC router and context creation.
 * Used by the NestJS adapter to integrate tRPC with Express.
 */

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { AiService } from "../ai/ai.service";
import { PrismaService } from "../database/prisma.service";
import { McpService } from "../mcp/mcp.service";
import { appRouter, AppRouter } from "./router";
import { Context, createContext } from "./trpc.context";

@Injectable()
export class TrpcService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => McpService))
    private mcpService: McpService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService
  ) {}

  /**
   * Get the tRPC app router
   */
  appRouter = appRouter;

  /**
   * Create tRPC context from Express request
   * Includes Prisma and services for use in routers
   */
  createContext = (req: any): Promise<Context> =>
    createContext({
      req,
      prisma: this.prisma,
      mcpService: this.mcpService,
      aiService: this.aiService,
    });

  /**
   * Export router type for client-side type inference
   */
  get routerType(): AppRouter {
    return this.appRouter;
  }
}
