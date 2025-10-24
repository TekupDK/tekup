"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SecurityConfigService = class SecurityConfigService {
    constructor(configService) {
        this.configService = configService;
        this.config = this.loadSecurityConfig();
        this.validateConfig();
    }
    getConfig() {
        return { ...this.config };
    }
    getJwtConfig() {
        return {
            secret: this.config.jwtSecret,
            expiresIn: this.config.jwtExpiresIn,
            refreshExpiresIn: this.config.refreshTokenExpiresIn,
        };
    }
    getRateLimitConfig() {
        return {
            window: this.config.rateLimitWindow,
            max: this.config.rateLimitMax,
            authMax: this.config.authRateLimitMax,
        };
    }
    getCorsConfig() {
        return {
            origin: this.config.allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        };
    }
    getFileUploadConfig() {
        return {
            maxSize: this.config.maxFileSize,
            allowedTypes: this.config.allowedFileTypes,
        };
    }
    getPasswordPolicy() {
        return {
            minLength: this.config.passwordMinLength,
            requireUppercase: this.config.passwordRequireUppercase,
            requireLowercase: this.config.passwordRequireLowercase,
            requireNumbers: this.config.passwordRequireNumbers,
            requireSpecialChars: this.config.passwordRequireSpecialChars,
            maxAge: this.config.passwordMaxAge,
        };
    }
    getAccountLockoutConfig() {
        return {
            maxAttempts: this.config.maxLoginAttempts,
            lockoutDuration: this.config.lockoutDuration,
        };
    }
    isProductionEnvironment() {
        return this.configService.get('NODE_ENV') === 'production';
    }
    loadSecurityConfig() {
        return {
            jwtSecret: this.configService.get('JWT_SECRET') || this.generateSecureSecret(),
            jwtExpiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
            refreshTokenExpiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
            bcryptRounds: parseInt(this.configService.get('BCRYPT_ROUNDS') || '12'),
            rateLimitWindow: parseInt(this.configService.get('RATE_LIMIT_WINDOW') || '900000'),
            rateLimitMax: parseInt(this.configService.get('RATE_LIMIT_MAX') || '100'),
            authRateLimitMax: parseInt(this.configService.get('AUTH_RATE_LIMIT_MAX') || '5'),
            sessionSecret: this.configService.get('SESSION_SECRET') || this.generateSecureSecret(),
            sessionMaxAge: parseInt(this.configService.get('SESSION_MAX_AGE') || '86400000'),
            allowedOrigins: this.configService.get('ALLOWED_ORIGINS')?.split(',') || [
                'http://localhost:3000',
                'https://app.rendetalje.dk',
            ],
            maxFileSize: parseInt(this.configService.get('MAX_FILE_SIZE') || '10485760'),
            allowedFileTypes: this.configService.get('ALLOWED_FILE_TYPES')?.split(',') || [
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/pdf',
                'text/plain',
            ],
            enableHSTS: this.configService.get('ENABLE_HSTS') === 'true',
            hstsMaxAge: parseInt(this.configService.get('HSTS_MAX_AGE') || '31536000'),
            encryptionKey: this.configService.get('ENCRYPTION_KEY') || this.generateSecureSecret(),
            auditLogRetentionDays: parseInt(this.configService.get('AUDIT_LOG_RETENTION_DAYS') || '365'),
            passwordMinLength: parseInt(this.configService.get('PASSWORD_MIN_LENGTH') || '8'),
            passwordRequireUppercase: this.configService.get('PASSWORD_REQUIRE_UPPERCASE') !== 'false',
            passwordRequireLowercase: this.configService.get('PASSWORD_REQUIRE_LOWERCASE') !== 'false',
            passwordRequireNumbers: this.configService.get('PASSWORD_REQUIRE_NUMBERS') !== 'false',
            passwordRequireSpecialChars: this.configService.get('PASSWORD_REQUIRE_SPECIAL_CHARS') !== 'false',
            passwordMaxAge: parseInt(this.configService.get('PASSWORD_MAX_AGE') || '7776000000'),
            maxLoginAttempts: parseInt(this.configService.get('MAX_LOGIN_ATTEMPTS') || '5'),
            lockoutDuration: parseInt(this.configService.get('LOCKOUT_DURATION') || '900000'),
            dataRetentionDays: parseInt(this.configService.get('DATA_RETENTION_DAYS') || '2555'),
            enableDataEncryption: this.configService.get('ENABLE_DATA_ENCRYPTION') !== 'false',
        };
    }
    validateConfig() {
        const errors = [];
        if (!this.config.jwtSecret || this.config.jwtSecret.length < 32) {
            errors.push('JWT_SECRET must be at least 32 characters long');
        }
        if (!this.config.encryptionKey || this.config.encryptionKey.length < 32) {
            errors.push('ENCRYPTION_KEY must be at least 32 characters long');
        }
        if (this.config.bcryptRounds < 10 || this.config.bcryptRounds > 15) {
            errors.push('BCRYPT_ROUNDS should be between 10 and 15');
        }
        if (this.config.passwordMinLength < 8) {
            errors.push('PASSWORD_MIN_LENGTH should be at least 8');
        }
        if (this.config.rateLimitMax < 1) {
            errors.push('RATE_LIMIT_MAX must be greater than 0');
        }
        if (this.config.authRateLimitMax < 1) {
            errors.push('AUTH_RATE_LIMIT_MAX must be greater than 0');
        }
        if (this.config.maxFileSize < 1024) {
            errors.push('MAX_FILE_SIZE should be at least 1KB');
        }
        if (this.config.maxFileSize > 100 * 1024 * 1024) {
            errors.push('MAX_FILE_SIZE should not exceed 100MB');
        }
        if (this.isProductionEnvironment()) {
            if (this.config.jwtSecret === this.generateSecureSecret()) {
                errors.push('JWT_SECRET must be explicitly set in production');
            }
            if (this.config.encryptionKey === this.generateSecureSecret()) {
                errors.push('ENCRYPTION_KEY must be explicitly set in production');
            }
            if (!this.config.enableHSTS) {
                errors.push('HSTS should be enabled in production');
            }
            if (this.config.allowedOrigins.includes('http://localhost:3000')) {
                errors.push('Localhost origins should not be allowed in production');
            }
        }
        if (errors.length > 0) {
            throw new Error(`Security configuration errors:\n${errors.join('\n')}`);
        }
    }
    generateSecureSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};
exports.SecurityConfigService = SecurityConfigService;
exports.SecurityConfigService = SecurityConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityConfigService);
//# sourceMappingURL=security-config.service.js.map