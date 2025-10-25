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
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
let EncryptionService = class EncryptionService {
    constructor(configService) {
        this.configService = configService;
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
        const key = this.configService.get('ENCRYPTION_KEY');
        if (!key) {
            throw new Error('ENCRYPTION_KEY must be set in environment variables');
        }
        this.encryptionKey = crypto.scryptSync(key, 'salt', this.keyLength);
    }
    encrypt(plaintext) {
        if (!plaintext) {
            return plaintext;
        }
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
            cipher.setAAD(Buffer.from('rendetalje-os', 'utf8'));
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
            return result;
        }
        catch (error) {
            throw new Error('Encryption failed');
        }
    }
    decrypt(encryptedData) {
        if (!encryptedData || !encryptedData.includes(':')) {
            return encryptedData;
        }
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
            decipher.setAAD(Buffer.from('rendetalje-os', 'utf8'));
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new Error('Decryption failed');
        }
    }
    async hashPassword(password) {
        const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS') || '12');
        return bcrypt.hash(password, saltRounds);
    }
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    generateSecurePassword(length = 16) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        const categories = [
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'abcdefghijklmnopqrstuvwxyz',
            '0123456789',
            '!@#$%^&*'
        ];
        categories.forEach(category => {
            password += category.charAt(crypto.randomInt(category.length));
        });
        for (let i = password.length; i < length; i++) {
            password += charset.charAt(crypto.randomInt(charset.length));
        }
        return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
    }
    createHmacSignature(data, secret) {
        const key = secret || this.encryptionKey.toString('hex');
        return crypto.createHmac('sha256', key).update(data).digest('hex');
    }
    verifyHmacSignature(data, signature, secret) {
        const expectedSignature = this.createHmacSignature(data, secret);
        return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    encryptObject(obj) {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString);
    }
    decryptObject(encryptedData) {
        const jsonString = this.decrypt(encryptedData);
        return JSON.parse(jsonString);
    }
    hashForIndex(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    encryptDeterministic(plaintext, context = '') {
        if (!plaintext) {
            return plaintext;
        }
        const hash = crypto.createHash('sha256').update(plaintext + context).digest();
        const iv = hash.slice(0, this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
        cipher.setAAD(Buffer.from('rendetalje-os-deterministic', 'utf8'));
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    }
    decryptDeterministic(encryptedData) {
        if (!encryptedData || !encryptedData.includes(':')) {
            return encryptedData;
        }
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAAD(Buffer.from('rendetalje-os-deterministic', 'utf8'));
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new Error('Deterministic decryption failed');
        }
    }
    secureCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    }
    generateSecureUuid() {
        return crypto.randomUUID();
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map