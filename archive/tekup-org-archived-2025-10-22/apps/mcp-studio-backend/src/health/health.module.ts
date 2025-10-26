import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { MCPStudioHealthService } from './mcp-studio-health.service';
import { MCPStudioHealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  controllers: [MCPStudioHealthController],
  providers: [
    MCPStudioHealthService,
    {
      provide: 'StandardHealthService',
      useExisting: MCPStudioHealthService,
    },
  ],
  exports: [MCPStudioHealthService],
})
export class HealthModule {}
