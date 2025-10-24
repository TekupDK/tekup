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
exports.Job = exports.JobStatus = exports.ServiceType = void 0;
const swagger_1 = require("@nestjs/swagger");
const base_entity_1 = require("../../common/entities/base.entity");
var ServiceType;
(function (ServiceType) {
    ServiceType["STANDARD"] = "standard";
    ServiceType["DEEP"] = "deep";
    ServiceType["WINDOW"] = "window";
    ServiceType["MOVEOUT"] = "moveout";
    ServiceType["OFFICE"] = "office";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["SCHEDULED"] = "scheduled";
    JobStatus["CONFIRMED"] = "confirmed";
    JobStatus["IN_PROGRESS"] = "in_progress";
    JobStatus["COMPLETED"] = "completed";
    JobStatus["CANCELLED"] = "cancelled";
    JobStatus["RESCHEDULED"] = "rescheduled";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
class Job extends base_entity_1.OrganizationEntity {
}
exports.Job = Job;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' }),
    __metadata("design:type", String)
], Job.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'JOB-2024-001-0001', description: 'Human-readable job number' }),
    __metadata("design:type", String)
], Job.prototype, "job_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ServiceType, example: ServiceType.STANDARD, description: 'Type of service' }),
    __metadata("design:type", String)
], Job.prototype, "service_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: JobStatus, example: JobStatus.SCHEDULED, description: 'Current job status' }),
    __metadata("design:type", String)
], Job.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:00:00.000Z', description: 'Scheduled date and time' }),
    __metadata("design:type", String)
], Job.prototype, "scheduled_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 120, description: 'Estimated duration in minutes' }),
    __metadata("design:type", Number)
], Job.prototype, "estimated_duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 135, description: 'Actual duration in minutes' }),
    __metadata("design:type", Number)
], Job.prototype, "actual_duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Job location address',
        example: {
            street: 'Hovedgade 123',
            city: 'København',
            postal_code: '1000',
            country: 'Denmark',
            coordinates: { lat: 55.6761, lng: 12.5683 }
        }
    }),
    __metadata("design:type", Object)
], Job.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ring på før ankomst', description: 'Special instructions' }),
    __metadata("design:type", String)
], Job.prototype, "special_instructions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Job checklist items',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                completed: { type: 'boolean' },
                photo_required: { type: 'boolean' },
                photo_url: { type: 'string' },
                notes: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Array)
], Job.prototype, "checklist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Job photos',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                url: { type: 'string' },
                type: { type: 'string', enum: ['before', 'after', 'during', 'issue'] },
                caption: { type: 'string' },
                uploaded_at: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Array)
], Job.prototype, "photos", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'base64-encoded-signature', description: 'Customer signature' }),
    __metadata("design:type", String)
], Job.prototype, "customer_signature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 4, description: 'Quality score (1-5)' }),
    __metadata("design:type", Number)
], Job.prototype, "quality_score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Profitability breakdown',
        example: {
            total_price: 1200,
            labor_cost: 600,
            material_cost: 100,
            travel_cost: 50,
            profit_margin: 450
        }
    }),
    __metadata("design:type", Object)
], Job.prototype, "profitability", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000003', description: 'Recurring job template ID' }),
    __metadata("design:type", String)
], Job.prototype, "recurring_job_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000004', description: 'Parent job ID (for rescheduled jobs)' }),
    __metadata("design:type", String)
], Job.prototype, "parent_job_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'INV-2024-001', description: 'Billy.dk invoice ID' }),
    __metadata("design:type", String)
], Job.prototype, "invoice_id", void 0);
//# sourceMappingURL=job.entity.js.map