import { ConfigService } from '@nestjs/config';
export declare class EncryptionService {
    private configService;
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly tagLength;
    private readonly encryptionKey;
    constructor(configService: ConfigService);
    encrypt(plaintext: string): string;
    decrypt(encryptedData: string): string;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    generateSecureToken(length?: number): string;
    generateSecurePassword(length?: number): string;
    createHmacSignature(data: string, secret?: string): string;
    verifyHmacSignature(data: string, signature: string, secret?: string): boolean;
    encryptObject(obj: any): string;
    decryptObject<T = any>(encryptedData: string): T;
    hashForIndex(data: string): string;
    encryptDeterministic(plaintext: string, context?: string): string;
    decryptDeterministic(encryptedData: string): string;
    secureCompare(a: string, b: string): boolean;
    generateSecureUuid(): string;
}
