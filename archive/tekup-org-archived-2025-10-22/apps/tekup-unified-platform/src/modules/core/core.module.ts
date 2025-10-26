import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { AuthService } from './services/auth.service';
import { TenantService } from './services/tenant.service';
import { AIService } from './services/ai.service';
import { CoreController } from './core.controller';

@Global()
@Module({
  controllers: [CoreController],
  providers: [
    PrismaService,
    AuthService,
    TenantService,
    AIService,
  ],
  exports: [
    PrismaService,
    AuthService,
    TenantService,
    AIService,
  ],
})
export class CoreModule {}
