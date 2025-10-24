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
exports.JobQualityAssessment = void 0;
const swagger_1 = require("@nestjs/swagger");
class JobQualityAssessment {
}
exports.JobQualityAssessment = JobQualityAssessment;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'Assessment ID' }),
    __metadata("design:type", String)
], JobQualityAssessment.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Job/Lead ID' }),
    __metadata("design:type", String)
], JobQualityAssessment.prototype, "job_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000003', description: 'Quality checklist ID' }),
    __metadata("design:type", String)
], JobQualityAssessment.prototype, "checklist_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000004', description: 'User who performed assessment' }),
    __metadata("design:type", String)
], JobQualityAssessment.prototype, "assessed_by", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Completed checklist items with photos and notes',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                completed: { type: 'boolean' },
                photo_urls: { type: 'array', items: { type: 'string' } },
                notes: { type: 'string' },
                points_earned: { type: 'number' },
                completion_time: { type: 'string' },
            },
        },
    }),
    __metadata("design:type", Array)
], JobQualityAssessment.prototype, "completed_items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: 'Overall quality score (1-5)', minimum: 1, maximum: 5 }),
    __metadata("design:type", Number)
], JobQualityAssessment.prototype, "overall_score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 85, description: 'Percentage score based on completed items' }),
    __metadata("design:type", Number)
], JobQualityAssessment.prototype, "percentage_score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 42, description: 'Total points earned' }),
    __metadata("design:type", Number)
], JobQualityAssessment.prototype, "total_points_earned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50, description: 'Maximum possible points' }),
    __metadata("design:type", Number)
], JobQualityAssessment.prototype, "max_possible_points", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Excellent work, all areas cleaned thoroughly', description: 'Assessment notes' }),
    __metadata("design:type", String)
], JobQualityAssessment.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'completed', description: 'Assessment status', enum: ['in_progress', 'completed', 'reviewed'] }),
    __metadata("design:type", String)
], JobQualityAssessment.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:00:00Z', description: 'Created timestamp' }),
    __metadata("design:type", Date)
], JobQualityAssessment.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:00:00Z', description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], JobQualityAssessment.prototype, "updated_at", void 0);
//# sourceMappingURL=job-quality-assessment.entity.js.map