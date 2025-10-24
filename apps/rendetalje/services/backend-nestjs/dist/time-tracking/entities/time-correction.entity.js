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
const base_entity_1 = require("../../common/entities/base.entity");
class TimeCorrection extends base_entity_1.BaseEntity {
}
exports.TimeCorrection = TimeCorrection;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'Original time entry ID' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "original_entry_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T08:00:00Z', description: 'Original start time' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "original_start_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T17:00:00Z', description: 'Original end time' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "original_end_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30, description: 'Original break duration in minutes' }),
    __metadata("design:type", Number)
], TimeCorrection.prototype, "original_break_duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T08:15:00Z', description: 'Corrected start time' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "corrected_start_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T17:15:00Z', description: 'Corrected end time' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "corrected_end_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 45, description: 'Corrected break duration in minutes' }),
    __metadata("design:type", Number)
], TimeCorrection.prototype, "corrected_break_duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Forgot to clock in on time', description: 'Reason for the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pending', enum: ['pending', 'approved', 'rejected'], description: 'Status of the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'User who submitted the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "submitted_by", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000001', description: 'User who approved the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "approved_by", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-16T09:00:00Z', description: 'When the correction was approved' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "approved_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000001', description: 'User who rejected the correction' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "rejected_by", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-16T09:00:00Z', description: 'When the correction was rejected' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "rejected_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Insufficient justification', description: 'Reason for rejection' }),
    __metadata("design:type", String)
], TimeCorrection.prototype, "rejection_reason", void 0);
//# sourceMappingURL=time-correction.entity.js.map