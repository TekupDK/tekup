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
exports.TimeEntryFiltersDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
class TimeEntryFiltersDto extends pagination_dto_1.PaginationDto {
}
exports.TimeEntryFiltersDto = TimeEntryFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000001', description: 'Filter by employee ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimeEntryFiltersDto.prototype, "employee_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000001', description: 'Filter by job ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimeEntryFiltersDto.prototype, "job_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15', description: 'Filter by specific date (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TimeEntryFiltersDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-01T00:00:00Z', description: 'Filter from start date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TimeEntryFiltersDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-31T23:59:59Z', description: 'Filter to end date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TimeEntryFiltersDto.prototype, "end_date", void 0);
//# sourceMappingURL=time-entry-filters.dto.js.map