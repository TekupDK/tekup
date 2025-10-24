import { ConfigService } from '@nestjs/config';
export declare class SecurityService {
    private readonly configService;
    private readonly logger;
    private readonly encryptionKey;
    constructor(configService: ConfigService);
    encrypt(text: string): string;
    decrypt(encryptedText: string): string;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    sanitizeInput(input: string): string;
    sanitizeObject(obj: Record<string, any>): Record<string, any>;
    validateSqlInput(input: string): boolean;
    escapeHtml(unsafe: string): string;
    generateCSRFToken(): string;
    verifyCSRFToken(token: string, sessionToken: string): boolean;
    generateRateLimitKey(ip: string, userId?: string): string;
    getSecurityHeaders(): Record<string, string>;
    private getCSPHeader;
    validateEmail(email: string): boolean;
    validatePhoneNumber(phone: string): boolean;
    validateUUID(uuid: string): boolean;
    validateFileType(filename: string, allowedTypes: string[]): boolean;
    validateFileSize(size: number, maxSize: number): boolean;
    scanFileContent(buffer: Buffer): {
        isSafe: boolean;
        threats: string[];
    };
    validateApiKey(apiKey: string): boolean;
    generateApiKey(): string;
    generateSessionId(): string;
    validateSessionId(sessionId: string): boolean;
    validateIPAddress(ip: string): boolean;
    isPrivateIP(ip: string): boolean;
    checkPasswordStrength(password: string): {
        score: number;
        feedback: string[];
        isStrong: boolean;
    };
    generateSecureRandom(length: number): string;
    generateSecureNumeric(length: number): string;
    private generateKey;
    detectSuspiciousActivity(events: any[]): {
        isSuspicious: boolean;
        reasons: string[];
        riskLevel: 'low' | 'medium' | 'high';
    };
}
