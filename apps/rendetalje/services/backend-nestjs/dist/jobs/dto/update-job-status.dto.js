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
exports.UpdateJobStatusDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const job_entity_1 = require("../entities/job.entity");
class UpdateJobStatusDto {
}
exports.UpdateJobStatusDto = UpdateJobStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: job_entity_1.JobStatus, example: job_entity_1.JobStatus.COMPLETED, description: 'New job status' }),
    (0, class_validator_1.IsEnum)(job_entity_1.JobStatus),
    __metadata("design:type", String)
], UpdateJobStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 135, description: 'Actual duration in minutes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateJobStatusDto.prototype, "actual_duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 4, description: 'Quality score (1-5)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateJobStatusDto.prototype, "quality_score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'base64-encoded-signature', description: 'Customer signature' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateJobStatusDto.prototype, "customer_signature", void 0);
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
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateJobStatusDto.prototype, "profitability", void 0);
//# sourceMappingURL=update-job-status.dto.js.map