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
const base_entity_1 = require("../../common/entities/base.entity");
class TimeEntry extends base_entity_1.BaseEntity {
}
exports.TimeEntry = TimeEntry;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "job_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Team member ID' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "team_member_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T08:00:00.000Z', description: 'Start time' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T10:30:00.000Z', description: 'End time' }),
    __metadata("design:type", String)
], TimeEntry.prototype, "end_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15, description: 'Break duration in minutes' }),
    __metadata("design:type", Number)
], TimeEntry.prototype, "break_duration", void 0);
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
//# sourceMappingURL=time-entry.entity.js.map