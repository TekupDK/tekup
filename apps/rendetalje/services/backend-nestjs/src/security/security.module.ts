import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { SecurityService } from "./security.service";
import { SecurityController } from "./security.controller";
import { AuditService } from "./audit.service";
import { ValidationService } from "./validation.service";
import { SecurityConfigService } from "./security-config.service";
import { EncryptionService } from "./encryption.service";

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    AuditService,
    ValidationService,
    SecurityConfigService,
    EncryptionService,
  ],
  exports: [
    SecurityService,
    AuditService,
    ValidationService,
    SecurityConfigService,
    EncryptionService,
  ],
})
export class SecurityModule {}
