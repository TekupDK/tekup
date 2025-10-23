import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('security.encryptionKey') || this.generateKey();
  }

  // Data Encryption
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encrypted = textParts.join(':');
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  // Password Hashing
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Input Sanitization
  sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;&|`$]/g, '') // Remove command injection characters
      .trim();
  }

  sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // SQL Injection Prevention
  validateSqlInput(input: string): boolean {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|")/,
      /(\bOR\b|\bAND\b).*(\b=\b|\bLIKE\b)/i,
    ];

    return !sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  // XSS Prevention
  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // CSRF Token Generation
  generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyCSRFToken(token: string, sessionToken: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    );
  }

  // Rate Limiting Helpers
  generateRateLimitKey(ip: string, userId?: string): string {
    return userId ? `rate_limit:user:${userId}` : `rate_limit:ip:${ip}`;
  }

  // Security Headers
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': this.getCSPHeader(),
    };
  }

  private getCSPHeader(): string {
    const frontendUrl = this.configService.get<string>('frontend.url') || 'http://localhost:3000';
    
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self' ${frontendUrl} wss: https:`,
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  // Data Validation
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  validatePhoneNumber(phone: string): boolean {
    // Danish phone number validation
    const phoneRegex = /^(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2})$/;
    return phoneRegex.test(phone);
  }

  validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // File Upload Security
  validateFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return allowedTypes.includes(extension || '');
  }

  validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  scanFileContent(buffer: Buffer): { isSafe: boolean; threats: string[] } {
    const threats: string[] = [];
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));

    // Check for script tags
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
      threats.push('Script tags detected');
    }

    // Check for executable signatures
    const executableSignatures = [
      'MZ', // PE executable
      '\x7fELF', // ELF executable
      'PK', // ZIP/JAR files
    ];

    const header = buffer.toString('ascii', 0, 4);
    if (executableSignatures.some(sig => header.startsWith(sig))) {
      threats.push('Executable file detected');
    }

    return {
      isSafe: threats.length === 0,
      threats,
    };
  }

  // API Security
  validateApiKey(apiKey: string): boolean {
    // Validate API key format and length
    return /^[a-zA-Z0-9]{32,64}$/.test(apiKey);
  }

  generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Session Security
  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateSessionId(sessionId: string): boolean {
    return /^[a-f0-9]{64}$/.test(sessionId);
  }

  // IP Address Validation
  validateIPAddress(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  // Security Audit Helpers
  checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    if (password.length >= 12) score += 1;

    return {
      score,
      feedback,
      isStrong: score >= 4,
    };
  }

  // Generate secure random values
  generateSecureRandom(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateSecureNumeric(length: number): string {
    const digits = '0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      result += digits[randomIndex];
    }
    
    return result;
  }

  private generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Security monitoring
  detectSuspiciousActivity(events: any[]): {
    isSuspicious: boolean;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for rapid successive requests
    const recentEvents = events.filter(e => 
      new Date(e.timestamp).getTime() > Date.now() - 60000 // Last minute
    );

    if (recentEvents.length > 50) {
      reasons.push('High frequency requests detected');
      riskLevel = 'high';
    } else if (recentEvents.length > 20) {
      reasons.push('Elevated request frequency');
      riskLevel = 'medium';
    }

    // Check for failed authentication attempts
    const failedAttempts = events.filter(e => 
      e.type === 'auth_failed' && 
      new Date(e.timestamp).getTime() > Date.now() - 300000 // Last 5 minutes
    );

    if (failedAttempts.length > 5) {
      reasons.push('Multiple failed authentication attempts');
      riskLevel = 'high';
    }

    // Check for unusual access patterns
    const uniqueIPs = new Set(events.map(e => e.ip)).size;
    if (uniqueIPs > 10) {
      reasons.push('Access from multiple IP addresses');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
      riskLevel,
    };
  }
}