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
var SecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
let SecurityService = SecurityService_1 = class SecurityService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SecurityService_1.name);
        this.encryptionKey = this.configService.get('security.encryptionKey') || this.generateKey();
    }
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        }
        catch (error) {
            this.logger.error('Encryption failed', error);
            throw new Error('Encryption failed');
        }
    }
    decrypt(encryptedText) {
        try {
            const textParts = encryptedText.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encrypted = textParts.join(':');
            const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.logger.error('Decryption failed', error);
            throw new Error('Decryption failed');
        }
    }
    async hashPassword(password) {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    sanitizeInput(input) {
        if (!input)
            return '';
        return input
            .replace(/[<>]/g, '')
            .replace(/['"]/g, '')
            .replace(/[;&|`$]/g, '')
            .trim();
    }
    sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    validateSqlInput(input) {
        const sqlInjectionPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
            /(--|\/\*|\*\/|;|'|")/,
            /(\bOR\b|\bAND\b).*(\b=\b|\bLIKE\b)/i,
        ];
        return !sqlInjectionPatterns.some(pattern => pattern.test(input));
    }
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    generateCSRFToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    verifyCSRFToken(token, sessionToken) {
        return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(sessionToken, 'hex'));
    }
    generateRateLimitKey(ip, userId) {
        return userId ? `rate_limit:user:${userId}` : `rate_limit:ip:${ip}`;
    }
    getSecurityHeaders() {
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
    getCSPHeader() {
        const frontendUrl = this.configService.get('frontend.url') || 'http://localhost:3000';
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
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    validatePhoneNumber(phone) {
        const phoneRegex = /^(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2})$/;
        return phoneRegex.test(phone);
    }
    validateUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    validateFileType(filename, allowedTypes) {
        const extension = filename.toLowerCase().split('.').pop();
        return allowedTypes.includes(extension || '');
    }
    validateFileSize(size, maxSize) {
        return size <= maxSize;
    }
    scanFileContent(buffer) {
        const threats = [];
        const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
        if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
            threats.push('Script tags detected');
        }
        const executableSignatures = [
            'MZ',
            '\x7fELF',
            'PK',
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
    validateApiKey(apiKey) {
        return /^[a-zA-Z0-9]{32,64}$/.test(apiKey);
    }
    generateApiKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }
    validateSessionId(sessionId) {
        return /^[a-f0-9]{64}$/.test(sessionId);
    }
    validateIPAddress(ip) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }
    isPrivateIP(ip) {
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
    checkPasswordStrength(password) {
        const feedback = [];
        let score = 0;
        if (password.length >= 8)
            score += 1;
        else
            feedback.push('Password should be at least 8 characters long');
        if (/[a-z]/.test(password))
            score += 1;
        else
            feedback.push('Password should contain lowercase letters');
        if (/[A-Z]/.test(password))
            score += 1;
        else
            feedback.push('Password should contain uppercase letters');
        if (/[0-9]/.test(password))
            score += 1;
        else
            feedback.push('Password should contain numbers');
        if (/[^a-zA-Z0-9]/.test(password))
            score += 1;
        else
            feedback.push('Password should contain special characters');
        if (password.length >= 12)
            score += 1;
        return {
            score,
            feedback,
            isStrong: score >= 4,
        };
    }
    generateSecureRandom(length) {
        return crypto.randomBytes(length).toString('hex');
    }
    generateSecureNumeric(length) {
        const digits = '0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, digits.length);
            result += digits[randomIndex];
        }
        return result;
    }
    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    detectSuspiciousActivity(events) {
        const reasons = [];
        let riskLevel = 'low';
        const recentEvents = events.filter(e => new Date(e.timestamp).getTime() > Date.now() - 60000);
        if (recentEvents.length > 50) {
            reasons.push('High frequency requests detected');
            riskLevel = 'high';
        }
        else if (recentEvents.length > 20) {
            reasons.push('Elevated request frequency');
            riskLevel = 'medium';
        }
        const failedAttempts = events.filter(e => e.type === 'auth_failed' &&
            new Date(e.timestamp).getTime() > Date.now() - 300000);
        if (failedAttempts.length > 5) {
            reasons.push('Multiple failed authentication attempts');
            riskLevel = 'high';
        }
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
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = SecurityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityService);
//# sourceMappingURL=security.service.js.map