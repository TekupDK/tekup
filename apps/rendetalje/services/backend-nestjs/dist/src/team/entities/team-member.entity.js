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
exports.TeamMember = void 0;
const swagger_1 = require("@nestjs/swagger");
const base_entity_1 = require("../../common/entities/base.entity");
class TeamMember extends base_entity_1.OrganizationEntity {
}
exports.TeamMember = TeamMember;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'Associated user ID' }),
    __metadata("design:type", String)
], TeamMember.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EMP-2024-0001', description: 'Employee ID' }),
    __metadata("design:type", String)
], TeamMember.prototype, "employee_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Employee skills',
        example: ['standard_cleaning', 'deep_cleaning', 'window_cleaning']
    }),
    __metadata("design:type", Array)
], TeamMember.prototype, "skills", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 250.00, description: 'Hourly rate in DKK' }),
    __metadata("design:type", Number)
], TeamMember.prototype, "hourly_rate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Weekly availability schedule',
        example: {
            monday: { start: '08:00', end: '16:00', available: true },
            tuesday: { start: '08:00', end: '16:00', available: true },
            wednesday: { start: '08:00', end: '16:00', available: true },
            thursday: { start: '08:00', end: '16:00', available: true },
            friday: { start: '08:00', end: '16:00', available: true },
            saturday: { start: '09:00', end: '14:00', available: false },
            sunday: { start: '09:00', end: '14:00', available: false }
        }
    }),
    __metadata("design:type", Object)
], TeamMember.prototype, "availability", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Performance metrics',
        example: {
            jobs_completed: 45,
            average_job_duration: 125,
            average_quality_score: 4.2,
            customer_satisfaction: 4.5,
            punctuality_score: 4.8,
            efficiency_rating: 4.3,
            total_hours_worked: 160,
            overtime_hours: 8
        }
    }),
    __metadata("design:type", Object)
], TeamMember.prototype, "performance_metrics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether team member is active' }),
    __metadata("design:type", Boolean)
], TeamMember.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15', description: 'Hire date' }),
    __metadata("design:type", String)
], TeamMember.prototype, "hire_date", void 0);
//# sourceMappingURL=team-member.entity.js.map