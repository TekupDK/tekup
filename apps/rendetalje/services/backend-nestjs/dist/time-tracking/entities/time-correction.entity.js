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
exports.TimeCorrection = void 0;
const swagger_1 = require("@nestjs/swagger");
class TimeCorrection {
}
exports.TimeCorrection = TimeCorrection;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxyz123', description: 'Correction ID' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxyz456', description: 'Original time entry ID' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "originalEntryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T08:00:00Z', description: 'Original start time' }),
    __metadata("design:type", Date)
], TimeCorrection.prototype, "originalStartTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T17:00:00Z', description: 'Original end time' }),
    __metadata("design:type", Date)
], TimeCorrection.prototype, "originalEndTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30, description: 'Original break duration in minutes' }),
    __metadata("design:type", Number)
], TimeCorrection.prototype, "originalBreakDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T08:15:00Z', description: 'Corrected start time' }),
    __metadata("design:type", Date)
], TimeCorrection.prototype, "correctedStartTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T17:15:00Z', description: 'Corrected end time' }),
    __metadata("design:type", Date)
], TimeCorrection.prototype, "correctedEndTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 45, description: 'Corrected break duration in minutes' }),
    __metadata("design:type", Number)
], TimeCorrection.prototype, "correctedBreakDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Forgot to clock in on time', description: 'Reason for the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pending', enum: ['pending', 'approved', 'rejected'], description: 'Status of the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxyz789', description: 'User who submitted the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "submittedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'clxyz111', description: 'User who approved the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "approvedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-16T09:00:00Z', description: 'When the correction was approved' }),
    __metadata("design:type", Date)
], TimeCorrection.prototype, "approvedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'clxyz222', description: 'User who rejected the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "rejectedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-16T09:00:00Z', description: 'When the correction was rejected' }),
    __metadata("design:type", Date)
], TimeCorrection.prototype, "rejectedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Insufficient justification', description: 'Reason for rejection' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "rejectionReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:00:00Z', description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], TimeCorrection.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-16T09:00:00Z', description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], TimeCorrection.prototype, "updatedAt", void 0);
//# sourceMappingURL=time-correction.entity.js.map