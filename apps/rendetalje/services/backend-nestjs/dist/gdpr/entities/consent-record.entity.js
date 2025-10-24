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
exports.ConsentRecord = void 0;
const swagger_1 = require("@nestjs/swagger");
class ConsentRecord {
}
exports.ConsentRecord = ConsentRecord;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxyz123', description: 'Record ID' }),
    __metadata("design:type", String)
], ConsentRecord.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxyz456', description: 'User ID' }),
    __metadata("design:type", String)
], ConsentRecord.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'marketing_emails', description: 'Type of consent' }),
    __metadata("design:type", String)
], ConsentRecord.prototype, "consentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether consent was granted' }),
    __metadata("design:type", Boolean)
], ConsentRecord.prototype, "granted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:00:00Z', description: 'When consent was granted' }),
    __metadata("design:type", Date)
], ConsentRecord.prototype, "grantedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-06-15T10:00:00Z', description: 'When consent was revoked' }),
    __metadata("design:type", Date)
], ConsentRecord.prototype, "revokedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '192.168.1.1', description: 'IP address of the user' }),
    __metadata("design:type", String)
], ConsentRecord.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mozilla/5.0...', description: 'User agent string' }),
    __metadata("design:type", String)
], ConsentRecord.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1.0', description: 'Privacy policy version' }),
    __metadata("design:type", String)
], ConsentRecord.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:00:00Z', description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], ConsentRecord.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:05:00Z', description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], ConsentRecord.prototype, "updatedAt", void 0);
//# sourceMappingURL=consent-record.entity.js.map