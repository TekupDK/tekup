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
exports.DataExportRequest = void 0;
const swagger_1 = require("@nestjs/swagger");
class DataExportRequest {
}
exports.DataExportRequest = DataExportRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxyz123', description: 'Request ID' }),
    __metadata("design:type", String)
], DataExportRequest.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxyz456', description: 'User ID' }),
    __metadata("design:type", String)
], DataExportRequest.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', description: 'User email' }),
    __metadata("design:type", String)
], DataExportRequest.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:00:00Z', description: 'Request date' }),
    __metadata("design:type", Date)
], DataExportRequest.prototype, "requestDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pending', enum: ['pending', 'processing', 'completed', 'failed'], description: 'Request status' }),
    __metadata("design:type", String)
], DataExportRequest.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://storage.example.com/exports/xyz.json', description: 'Download URL' }),
    __metadata("design:type", String)
], DataExportRequest.prototype, "downloadUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-02-15T10:00:00Z', description: 'URL expiration date' }),
    __metadata("design:type", Date)
], DataExportRequest.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:00:00Z', description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], DataExportRequest.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:05:00Z', description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], DataExportRequest.prototype, "updatedAt", void 0);
//# sourceMappingURL=data-export-request.entity.js.map