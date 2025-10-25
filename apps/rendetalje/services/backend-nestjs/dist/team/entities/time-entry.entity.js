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
exports.TimeEntry = void 0;
const swagger_1 = require("@nestjs/swagger");
class TimeEntry {
}
exports.TimeEntry = TimeEntry;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxxx...', description: 'Time entry ID' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clyyy...', description: 'Team member ID' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "teamMemberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'clzzz...', description: 'Lead ID' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "leadId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'clkkk...', description: 'Booking ID' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "bookingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T08:00:00.000Z', description: 'Start time' }),
    __metadata("design:type", Date)
], TimeEntry.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T10:30:00.000Z', description: 'End time' }),
    __metadata("design:type", Date)
], TimeEntry.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15, description: 'Break duration in minutes' }),
    __metadata("design:type", Number)
], TimeEntry.prototype, "breakDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Completed all tasks on schedule', description: 'Notes about the time entry' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'GPS location for verification',
        example: { lat: 55.6761, lng: 12.5683 }
    }),
    __metadata("design:type", Object)
], TimeEntry.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], TimeEntry.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], TimeEntry.prototype, "updatedAt", void 0);
//# sourceMappingURL=time-entry.entity.js.map