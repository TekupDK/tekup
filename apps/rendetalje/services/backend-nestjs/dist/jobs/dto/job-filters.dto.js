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
exports.JobFiltersDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const job_entity_1 = require("../entities/job.entity");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
class JobFiltersDto extends pagination_dto_1.PaginationDto {
}
exports.JobFiltersDto = JobFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: job_entity_1.JobStatus, description: 'Filter by job status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(job_entity_1.JobStatus),
    __metadata("design:type", String)
], JobFiltersDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: job_entity_1.ServiceType, description: 'Filter by service type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(job_entity_1.ServiceType),
    __metadata("design:type", String)
], JobFiltersDto.prototype, "service_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000002', description: 'Filter by customer ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], JobFiltersDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000003', description: 'Filter by assigned team member ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], JobFiltersDto.prototype, "team_member_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-01', description: 'Filter by date from (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], JobFiltersDto.prototype, "date_from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-31', description: 'Filter by date to (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], JobFiltersDto.prototype, "date_to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'København', description: 'Filter by city' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobFiltersDto.prototype, "city", void 0);
//# sourceMappingURL=job-filters.dto.js.map