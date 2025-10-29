import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { McpService } from './mcp.service';
import { HttpMcpClient } from './clients/http-mcp.client';
import { StdioMcpClient } from './clients/stdio-mcp.client';
import { McpRegistryService } from './registry/mcp-registry.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    McpService,
    HttpMcpClient,
    StdioMcpClient,
    McpRegistryService,
  ],
  exports: [
    McpService,
    HttpMcpClient,
    StdioMcpClient,
    McpRegistryService,
  ],
})
export class McpModule {}
