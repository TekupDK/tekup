import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { AuditService } from './audit.service';
import { DataProtectionService } from './data-protection.service';
import { AuditLoggerService } from './audit-logger.service';
import { ValidationService } from './validation.service';
import { SecurityConfigService } from './security-config.service';
import { SecurityMiddleware } from './security.middleware';
import { EnhancedAuthGuard } from './enhanced-auth.guard';
import { EncryptionService } from './encryption.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [ConfigModule, SupabaseModule],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    AuditService,
    DataProtectionService,
    AuditLoggerService,
    ValidationService,
    SecurityConfigService,
    SecurityMiddleware,
    EnhancedAuthGuard,
    EncryptionService,
  ],
  exports: [
    SecurityService,
    AuditService,
    DataProtectionService,
    AuditLoggerService,
    ValidationService,
    SecurityConfigService,
    EnhancedAuthGuard,
    EncryptionService,
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}