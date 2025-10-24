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
exports.CreateJobDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const job_entity_1 = require("../entities/job.entity");
class AddressDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Hovedgade 123', description: 'Street address' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "street", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'København', description: 'City' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1000', description: 'Postal code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "postal_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Denmark', description: 'Country' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'GPS coordinates',
        example: { lat: 55.6761, lng: 12.5683 }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AddressDto.prototype, "coordinates", void 0);
class ChecklistItemDto {
    constructor() {
        this.completed = false;
        this.photo_required = false;
    }
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'vacuum_floors', description: 'Checklist item ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Støvsug alle gulve', description: 'Checklist item title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Whether item is completed' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ChecklistItemDto.prototype, "completed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether photo is required' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ChecklistItemDto.prototype, "photo_required", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/photo.jpg', description: 'Photo URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "photo_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Extra notes', description: 'Additional notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "notes", void 0);
class CreateJobDto {
}
exports.CreateJobDto = CreateJobDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: job_entity_1.ServiceType, example: job_entity_1.ServiceType.STANDARD, description: 'Type of service' }),
    (0, class_validator_1.IsEnum)(job_entity_1.ServiceType),
    __metadata("design:type", String)
], CreateJobDto.prototype, "service_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:00:00.000Z', description: 'Scheduled date and time' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "scheduled_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 120, description: 'Estimated duration in minutes', minimum: 30, maximum: 480 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(30),
    (0, class_validator_1.Max)(480),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "estimated_duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Job location address' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressDto),
    __metadata("design:type", AddressDto)
], CreateJobDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ring på før ankomst', description: 'Special instructions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "special_instructions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job checklist items' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", Array)
], CreateJobDto.prototype, "checklist", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000003', description: 'Recurring job template ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "recurring_job_id", void 0);
//# sourceMappingURL=create-job.dto.js.map