import { ConfigService } from '@nestjs/config';
export interface SecurityConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptRounds: number;
    rateLimitWindow: number;
    rateLimitMax: number;
    authRateLimitMax: number;
    sessionSecret: string;
    sessionMaxAge: number;
    allowedOrigins: string[];
    maxFileSize: number;
    allowedFileTypes: string[];
    enableHSTS: boolean;
    hstsMaxAge: number;
    encryptionKey: string;
    auditLogRetentionDays: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    passwordMaxAge: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    dataRetentionDays: number;
    enableDataEncryption: boolean;
}
export declare class SecurityConfigService {
    private configService;
    private readonly config;
    constructor(configService: ConfigService);
    getConfig(): SecurityConfig;
    getJwtConfig(): {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    getRateLimitConfig(): {
        window: number;
        max: number;
        authMax: number;
    };
    getCorsConfig(): {
        origin: string[];
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
    };
    getFileUploadConfig(): {
        maxSize: number;
        allowedTypes: string[];
    };
    getPasswordPolicy(): {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        maxAge: number;
    };
    getAccountLockoutConfig(): {
        maxAttempts: number;
        lockoutDuration: number;
    };
    isProductionEnvironment(): boolean;
    private loadSecurityConfig;
    private validateConfig;
    private generateSecureSecret;
}
