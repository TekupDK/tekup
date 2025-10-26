import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MCPServerDevelopmentService } from './server-development.service';
import { MCPController } from './mcp.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MCPController],
  providers: [MCPServerDevelopmentService],
  exports: [MCPServerDevelopmentService],
})
export class MCPModule {}
