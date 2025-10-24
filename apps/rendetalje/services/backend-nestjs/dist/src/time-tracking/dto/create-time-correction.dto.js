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
exports.CreateTimeCorrectionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateTimeCorrectionDto {
}
exports.CreateTimeCorrectionDto = CreateTimeCorrectionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'Original time entry ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTimeCorrectionDto.prototype, "original_entry_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T08:15:00Z', description: 'Corrected start time' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimeCorrectionDto.prototype, "corrected_start_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T17:15:00Z', description: 'Corrected end time' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimeCorrectionDto.prototype, "corrected_end_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 45, description: 'Corrected break duration in minutes' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTimeCorrectionDto.prototype, "corrected_break_duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Forgot to clock in on time due to traffic', description: 'Reason for the correction' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTimeCorrectionDto.prototype, "reason", void 0);
//# sourceMappingURL=create-time-correction.dto.js.map