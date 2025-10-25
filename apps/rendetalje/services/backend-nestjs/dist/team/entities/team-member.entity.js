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
class TeamMember {
}
exports.TeamMember = TeamMember;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxxx...', description: 'Team member ID' }),
    __metadata("design:type", String)
], TeamMember.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clyyy...', description: 'Associated user ID' }),
    __metadata("design:type", String)
], TeamMember.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EMP-2024-0001', description: 'Employee ID' }),
    __metadata("design:type", String)
], TeamMember.prototype, "employeeId", void 0);
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
], TeamMember.prototype, "hourlyRate", void 0);
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
            jobsCompleted: 45,
            averageJobDuration: 125,
            averageQualityScore: 4.2,
            customerSatisfaction: 4.5,
            punctualityScore: 4.8,
            efficiencyRating: 4.3,
            totalHoursWorked: 160,
            overtimeHours: 8
        }
    }),
    __metadata("design:type", Object)
], TeamMember.prototype, "performanceMetrics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether team member is active' }),
    __metadata("design:type", Boolean)
], TeamMember.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15', description: 'Hire date' }),
    __metadata("design:type", Date)
], TeamMember.prototype, "hireDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], TeamMember.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], TeamMember.prototype, "updatedAt", void 0);
//# sourceMappingURL=team-member.entity.js.map