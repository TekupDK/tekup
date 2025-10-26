import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MCPServerService } from './mcp-server.service';
import { MCPServerController } from './mcp-server.controller';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [MCPServerService],
  controllers: [MCPServerController],
  exports: [MCPServerService],
})
export class MCPServerModule {}