import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  // Authentication
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptRounds: number;
  
  // Rate limiting
  rateLimitWindow: number;
  rateLimitMax: number;
  authRateLimitMax: number;
  
  // Session
  sessionSecret: string;
  sessionMaxAge: number;
  
  // CORS
  allowedOrigins: string[];
  
  // File upload
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // Security headers
  enableHSTS: boolean;
  hstsMaxAge: number;
  
  // Encryption
  encryptionKey: string;
  
  // Audit logging
  auditLogRetentionDays: number;
  
  // Password policy
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordMaxAge: number;
  
  // Account lockout
  maxLoginAttempts: number;
  lockoutDuration: number;
  
  // Data protection
  dataRetentionDays: number;
  enableDataEncryption: boolean;
}

@Injectable()
export class SecurityConfigService {
  private readonly config: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.config = this.loadSecurityConfig();
    this.validateConfig();
  }

  getConfig(): SecurityConfig {
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

  isProductionEnvironment(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  private loadSecurityConfig(): SecurityConfig {
    return {
      // Authentication
      jwtSecret: this.configService.get('JWT_SECRET') || this.generateSecureSecret(),
      jwtExpiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
      refreshTokenExpiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
      bcryptRounds: parseInt(this.configService.get('BCRYPT_ROUNDS') || '12'),
      
      // Rate limiting
      rateLimitWindow: parseInt(this.configService.get('RATE_LIMIT_WINDOW') || '900000'), // 15 minutes
      rateLimitMax: parseInt(this.configService.get('RATE_LIMIT_MAX') || '100'),
      authRateLimitMax: parseInt(this.configService.get('AUTH_RATE_LIMIT_MAX') || '5'),
      
      // Session
      sessionSecret: this.configService.get('SESSION_SECRET') || this.generateSecureSecret(),
      sessionMaxAge: parseInt(this.configService.get('SESSION_MAX_AGE') || '86400000'), // 24 hours
      
      // CORS
      allowedOrigins: this.configService.get('ALLOWED_ORIGINS')?.split(',') || [
        'http://localhost:3000',
        'https://app.rendetalje.dk',
      ],
      
      // File upload
      maxFileSize: parseInt(this.configService.get('MAX_FILE_SIZE') || '10485760'), // 10MB
      allowedFileTypes: this.configService.get('ALLOWED_FILE_TYPES')?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'text/plain',
      ],
      
      // Security headers
      enableHSTS: this.configService.get('ENABLE_HSTS') === 'true',
      hstsMaxAge: parseInt(this.configService.get('HSTS_MAX_AGE') || '31536000'), // 1 year
      
      // Encryption
      encryptionKey: this.configService.get('ENCRYPTION_KEY') || this.generateSecureSecret(),
      
      // Audit logging
      auditLogRetentionDays: parseInt(this.configService.get('AUDIT_LOG_RETENTION_DAYS') || '365'),
      
      // Password policy
      passwordMinLength: parseInt(this.configService.get('PASSWORD_MIN_LENGTH') || '8'),
      passwordRequireUppercase: this.configService.get('PASSWORD_REQUIRE_UPPERCASE') !== 'false',
      passwordRequireLowercase: this.configService.get('PASSWORD_REQUIRE_LOWERCASE') !== 'false',
      passwordRequireNumbers: this.configService.get('PASSWORD_REQUIRE_NUMBERS') !== 'false',
      passwordRequireSpecialChars: this.configService.get('PASSWORD_REQUIRE_SPECIAL_CHARS') !== 'false',
      passwordMaxAge: parseInt(this.configService.get('PASSWORD_MAX_AGE') || '7776000000'), // 90 days
      
      // Account lockout
      maxLoginAttempts: parseInt(this.configService.get('MAX_LOGIN_ATTEMPTS') || '5'),
      lockoutDuration: parseInt(this.configService.get('LOCKOUT_DURATION') || '900000'), // 15 minutes
      
      // Data protection
      dataRetentionDays: parseInt(this.configService.get('DATA_RETENTION_DAYS') || '2555'), // 7 years
      enableDataEncryption: this.configService.get('ENABLE_DATA_ENCRYPTION') !== 'false',
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate JWT secret
    if (!this.config.jwtSecret || this.config.jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }

    // Validate encryption key
    if (!this.config.encryptionKey || this.config.encryptionKey.length < 32) {
      errors.push('ENCRYPTION_KEY must be at least 32 characters long');
    }

    // Validate bcrypt rounds
    if (this.config.bcryptRounds < 10 || this.config.bcryptRounds > 15) {
      errors.push('BCRYPT_ROUNDS should be between 10 and 15');
    }

    // Validate password policy
    if (this.config.passwordMinLength < 8) {
      errors.push('PASSWORD_MIN_LENGTH should be at least 8');
    }

    // Validate rate limits
    if (this.config.rateLimitMax < 1) {
      errors.push('RATE_LIMIT_MAX must be greater than 0');
    }

    if (this.config.authRateLimitMax < 1) {
      errors.push('AUTH_RATE_LIMIT_MAX must be greater than 0');
    }

    // Validate file upload limits
    if (this.config.maxFileSize < 1024) {
      errors.push('MAX_FILE_SIZE should be at least 1KB');
    }

    if (this.config.maxFileSize > 100 * 1024 * 1024) {
      errors.push('MAX_FILE_SIZE should not exceed 100MB');
    }

    // In production, enforce stricter requirements
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

  private generateSecureSecret(): string {
    // This is a fallback - in production, secrets should be explicitly set
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}