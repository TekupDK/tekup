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
exports.CreateQualityChecklistDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const job_entity_1 = require("../../jobs/entities/job.entity");
class ChecklistItemDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'vacuum_floors', description: 'Unique item ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Støvsug alle gulve', description: 'Item title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Støvsug alle gulvtyper grundigt', description: 'Item description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether item is required' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ChecklistItemDto.prototype, "required", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Whether photo documentation is required' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ChecklistItemDto.prototype, "photo_required", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Display order' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ChecklistItemDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'floors', description: 'Item category' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, description: 'Points awarded for completion' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], ChecklistItemDto.prototype, "points", void 0);
class CreateQualityChecklistDto {
}
exports.CreateQualityChecklistDto = CreateQualityChecklistDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: job_entity_1.ServiceType, example: job_entity_1.ServiceType.STANDARD, description: 'Service type' }),
    (0, class_validator_1.IsEnum)(job_entity_1.ServiceType),
    __metadata("design:type", String)
], CreateQualityChecklistDto.prototype, "service_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Standard Cleaning Checklist', description: 'Checklist name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateQualityChecklistDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Comprehensive checklist for standard cleaning services', description: 'Checklist description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateQualityChecklistDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Checklist items' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", Array)
], CreateQualityChecklistDto.prototype, "items", void 0);
//# sourceMappingURL=create-quality-checklist.dto.js.map