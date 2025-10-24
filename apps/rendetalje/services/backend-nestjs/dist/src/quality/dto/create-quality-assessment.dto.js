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
exports.CreateQualityAssessmentDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CompletedItemDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'vacuum_floors', description: 'Checklist item ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompletedItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether item was completed' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CompletedItemDto.prototype, "completed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Photo URLs for documentation',
        example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CompletedItemDto.prototype, "photo_urls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Extra attention given to corners', description: 'Additional notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CompletedItemDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, description: 'Points earned for this item' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompletedItemDto.prototype, "points_earned", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15T10:30:00.000Z', description: 'When item was completed' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CompletedItemDto.prototype, "completion_time", void 0);
class CreateQualityAssessmentDto {
}
exports.CreateQualityAssessmentDto = CreateQualityAssessmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQualityAssessmentDto.prototype, "job_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Quality checklist ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQualityAssessmentDto.prototype, "checklist_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Completed checklist items' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CompletedItemDto),
    __metadata("design:type", Array)
], CreateQualityAssessmentDto.prototype, "completed_items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: 'Overall quality score (1-5)', minimum: 1, maximum: 5 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateQualityAssessmentDto.prototype, "overall_score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Excellent work, all areas cleaned thoroughly', description: 'Assessment notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateQualityAssessmentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-quality-assessment.dto.js.map