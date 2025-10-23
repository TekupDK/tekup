import { Injectable } from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';
import * as validator from 'validator';

@Injectable()
export class ValidationService {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Sanitize text input by removing potentially dangerous characters
   */
  sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Remove null bytes and control characters
    return input
      .replace(/\0/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
  }

  /**
   * Validate and sanitize email addresses
   */
  validateEmail(email: string): { isValid: boolean; sanitized: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    const sanitized = this.sanitizeText(email.toLowerCase());
    const isValid = validator.isEmail(sanitized);

    return { isValid, sanitized };
  }

  /**
   * Validate phone numbers (Danish format)
   */
  validatePhoneNumber(phone: string): { isValid: boolean; sanitized: string } {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    // Remove all non-digit characters except +
    const sanitized = phone.replace(/[^\d+]/g, '');
    
    // Danish phone number validation
    const danishPhoneRegex = /^(\+45)?[2-9]\d{7}$/;
    const isValid = danishPhoneRegex.test(sanitized);

    return { isValid, sanitized };
  }

  /**
   * Validate Danish postal codes
   */
  validatePostalCode(postalCode: string): { isValid: boolean; sanitized: string } {
    if (!postalCode || typeof postalCode !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    const sanitized = postalCode.replace(/\D/g, '');
    const isValid = /^\d{4}$/.test(sanitized);

    return { isValid, sanitized };
  }

  /**
   * Validate URLs
   */
  validateUrl(url: string): { isValid: boolean; sanitized: string } {
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

  /**
   * Validate file names to prevent path traversal
   */
  validateFileName(fileName: string): { isValid: boolean; sanitized: string } {
    if (!fileName || typeof fileName !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    // Remove path traversal attempts and dangerous characters
    const sanitized = fileName
      .replace(/[\/\\:*?"<>|]/g, '')
      .replace(/\.\./g, '')
      .replace(/^\.+/, '')
      .trim();

    // Check for valid file name
    const isValid = sanitized.length > 0 && 
                   sanitized.length <= 255 && 
                   !/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(sanitized);

    return { isValid, sanitized };
  }

  /**
   * Validate and sanitize SQL-like inputs to prevent injection
   */
  validateSqlInput(input: string): { isValid: boolean; sanitized: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    const sanitized = this.sanitizeText(input);
    
    // Check for common SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|")/,
      /(\bOR\b|\bAND\b).*[=<>]/i,
    ];

    const isValid = !sqlInjectionPatterns.some(pattern => pattern.test(sanitized));

    return { isValid, sanitized };
  }

  /**
   * Validate JSON input
   */
  validateJson(input: string): { isValid: boolean; parsed: any } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, parsed: null };
    }

    try {
      const parsed = JSON.parse(input);
      
      // Additional validation for object depth and size
      const jsonString = JSON.stringify(parsed);
      if (jsonString.length > 1000000) { // 1MB limit
        return { isValid: false, parsed: null };
      }

      return { isValid: true, parsed };
    } catch (error) {
      return { isValid: false, parsed: null };
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[] 
  } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, score: 0, feedback: ['Password is required'] };
    }

    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 2;

    // Common patterns check
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

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj: any, maxDepth: number = 10): any {
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
      const sanitized: any = {};
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
}