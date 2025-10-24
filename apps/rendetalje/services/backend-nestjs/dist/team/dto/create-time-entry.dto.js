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
exports.CreateTimeEntryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateTimeEntryDto {
    constructor() {
        this.breakDuration = 0;
    }
}
exports.CreateTimeEntryDto = CreateTimeEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxxx...', description: 'Team member ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTimeEntryDto.prototype, "teamMemberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'clyyy...', description: 'Lead ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTimeEntryDto.prototype, "leadId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'clzzz...', description: 'Booking ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTimeEntryDto.prototype, "bookingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T08:00:00.000Z', description: 'Start time' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimeEntryDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T10:30:00.000Z', description: 'End time' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimeEntryDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15, description: 'Break duration in minutes' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTimeEntryDto.prototype, "breakDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Completed all tasks on schedule', description: 'Notes about the time entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateTimeEntryDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'GPS location for verification',
        example: { lat: 55.6761, lng: 12.5683 }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTimeEntryDto.prototype, "location", void 0);
//# sourceMappingURL=create-time-entry.dto.js.map