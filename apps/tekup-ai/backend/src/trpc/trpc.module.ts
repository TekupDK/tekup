/**
 * tRPC Module
 * 
 * NestJS module for tRPC integration.
 * Exports the router and context creation function.
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { DatabaseModule } from '../database/database.module';
import { McpModule } from '../mcp/mcp.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [DatabaseModule, McpModule, AiModule],
  providers: [TrpcService],
  exports: [TrpcService],
})
export class TrpcModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // tRPC middleware will be added in main.ts
  }
}
