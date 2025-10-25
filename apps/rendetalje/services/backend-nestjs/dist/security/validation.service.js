"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const common_1 = require("@nestjs/common");
const DOMPurify = require("isomorphic-dompurify");
const validator = require("validator");
let ValidationService = class ValidationService {
    sanitizeHtml(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }
        return DOMPurify.sanitize(input, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
            ALLOWED_ATTR: [],
        });
    }
    sanitizeText(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }
        return input
            .replace(/\0/g, '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .trim();
    }
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { isValid: false, sanitized: '' };
        }
        const sanitized = this.sanitizeText(email.toLowerCase());
        const isValid = validator.isEmail(sanitized);
        return { isValid, sanitized };
    }
    validatePhoneNumber(phone) {
        if (!phone || typeof phone !== 'string') {
            return { isValid: false, sanitized: '' };
        }
        const sanitized = phone.replace(/[^\d+]/g, '');
        const danishPhoneRegex = /^(\+45)?[2-9]\d{7}$/;
        const isValid = danishPhoneRegex.test(sanitized);
        return { isValid, sanitized };
    }
    validatePostalCode(postalCode) {
        if (!postalCode || typeof postalCode !== 'string') {
            return { isValid: false, sanitized: '' };
        }
        const sanitized = postalCode.replace(/\D/g, '');
        const isValid = /^\d{4}$/.test(sanitized);
        return { isValid, sanitized };
    }
    validateUrl(url) {
        if (!url || typeof url !== 'string') {
            return { isValid: false, sanitized: '' };
        }
        const sanitized = this.sanitizeText(url);
        const isValid = validator.isURL(sanitized, {
            protocols: ['http', 'https'],
            require_protocol: true,
        });
        return { isValid, sanitized };
    }
    validateFileName(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return { isValid: false, sanitized: '' };
        }
        const sanitized = fileName
            .replace(/[\/\\:*?"<>|]/g, '')
            .replace(/\.\./g, '')
            .replace(/^\.+/, '')
            .trim();
        const isValid = sanitized.length > 0 &&
            sanitized.length <= 255 &&
            !/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(sanitized);
        return { isValid, sanitized };
    }
    validateSqlInput(input) {
        if (!input || typeof input !== 'string') {
            return { isValid: false, sanitized: '' };
        }
        const sanitized = this.sanitizeText(input);
        const sqlInjectionPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
            /(--|\/\*|\*\/|;|'|")/,
            /(\bOR\b|\bAND\b).*[=<>]/i,
        ];
        const isValid = !sqlInjectionPatterns.some(pattern => pattern.test(sanitized));
        return { isValid, sanitized };
    }
    validateJson(input) {
        if (!input || typeof input !== 'string') {
            return { isValid: false, parsed: null };
        }
        try {
            const parsed = JSON.parse(input);
            const jsonString = JSON.stringify(parsed);
            if (jsonString.length > 1000000) {
                return { isValid: false, parsed: null };
            }
            return { isValid: true, parsed };
        }
        catch (error) {
            return { isValid: false, parsed: null };
        }
    }
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { isValid: false, score: 0, feedback: ['Password is required'] };
        }
        const feedback = [];
        let score = 0;
        if (password.length < 8) {
            feedback.push('Password must be at least 8 characters long');
        }
        else if (password.length >= 12) {
            score += 2;
        }
        else {
            score += 1;
        }
        if (/[a-z]/.test(password))
            score += 1;
        if (/[A-Z]/.test(password))
            score += 1;
        if (/\d/.test(password))
            score += 1;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
            score += 2;
        if (/(.)\1{2,}/.test(password)) {
            feedback.push('Avoid repeated characters');
            score -= 1;
        }
        if (/123|abc|qwe|password|admin/i.test(password)) {
            feedback.push('Avoid common patterns and words');
            score -= 2;
        }
        const isValid = score >= 4 && password.length >= 8;
        if (!isValid && feedback.length === 0) {
            feedback.push('Password should include uppercase, lowercase, numbers, and special characters');
        }
        return { isValid, score: Math.max(0, score), feedback };
    }
    sanitizeObject(obj, maxDepth = 10) {
        if (maxDepth <= 0) {
            return null;
        }
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (typeof obj === 'string') {
            return this.sanitizeText(obj);
        }
        if (typeof obj === 'number' || typeof obj === 'boolean') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
        }
        if (typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const sanitizedKey = this.sanitizeText(key);
                if (sanitizedKey) {
                    sanitized[sanitizedKey] = this.sanitizeObject(value, maxDepth - 1);
                }
            }
            return sanitized;
        }
        return null;
    }
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = __decorate([
    (0, common_1.Injectable)()
], ValidationService);
//# sourceMappingURL=validation.service.js.map