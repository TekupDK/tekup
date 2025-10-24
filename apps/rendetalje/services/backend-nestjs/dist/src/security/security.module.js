"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const security_service_1 = require("./security.service");
const security_controller_1 = require("./security.controller");
const audit_service_1 = require("./audit.service");
const data_protection_service_1 = require("./data-protection.service");
const audit_logger_service_1 = require("./audit-logger.service");
const validation_service_1 = require("./validation.service");
const security_config_service_1 = require("./security-config.service");
const security_middleware_1 = require("./security.middleware");
const enhanced_auth_guard_1 = require("./enhanced-auth.guard");
const encryption_service_1 = require("./encryption.service");
const supabase_module_1 = require("../supabase/supabase.module");
let SecurityModule = class SecurityModule {
    configure(consumer) {
        consumer
            .apply(security_middleware_1.SecurityMiddleware)
            .forRoutes('*');
    }
};
exports.SecurityModule = SecurityModule;
exports.SecurityModule = SecurityModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, supabase_module_1.SupabaseModule],
        controllers: [security_controller_1.SecurityController],
        providers: [
            security_service_1.SecurityService,
            audit_service_1.AuditService,
            data_protection_service_1.DataProtectionService,
            audit_logger_service_1.AuditLoggerService,
            validation_service_1.ValidationService,
            security_config_service_1.SecurityConfigService,
            security_middleware_1.SecurityMiddleware,
            enhanced_auth_guard_1.EnhancedAuthGuard,
            encryption_service_1.EncryptionService,
        ],
        exports: [
            security_service_1.SecurityService,
            audit_service_1.AuditService,
            data_protection_service_1.DataProtectionService,
            audit_logger_service_1.AuditLoggerService,
            validation_service_1.ValidationService,
            security_config_service_1.SecurityConfigService,
            enhanced_auth_guard_1.EnhancedAuthGuard,
            encryption_service_1.EncryptionService,
        ],
    })
], SecurityModule);
//# sourceMappingURL=security.module.js.map