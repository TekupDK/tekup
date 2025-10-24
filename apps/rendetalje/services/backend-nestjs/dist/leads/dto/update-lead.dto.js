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
exports.UpdateLeadDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_lead_dto_1 = require("./create-lead.dto");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const lead_entity_1 = require("../entities/lead.entity");
class UpdateLeadDto extends (0, swagger_1.PartialType)(create_lead_dto_1.CreateLeadDto) {
}
exports.UpdateLeadDto = UpdateLeadDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ enum: lead_entity_1.LeadStatus, description: 'Lead status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(lead_entity_1.LeadStatus),
    __metadata("design:type", String)
], UpdateLeadDto.prototype, "status", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 2, description: 'Number of follow-up attempts' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateLeadDto.prototype, "followUpAttempts", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: '2024-01-10T10:00:00Z', description: 'Last follow-up date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateLeadDto.prototype, "lastFollowUpDate", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Acme Corp', description: 'Company name from enrichment' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLeadDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Technology', description: 'Industry sector' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLeadDto.prototype, "industry", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: '11-50 employees', description: 'Estimated company size' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLeadDto.prototype, "estimatedSize", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 5000, description: 'Estimated lead value in DKK' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLeadDto.prototype, "estimatedValue", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 75, description: 'Lead score (0-100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateLeadDto.prototype, "score", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ enum: lead_entity_1.LeadPriority, description: 'Lead priority' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(lead_entity_1.LeadPriority),
    __metadata("design:type", String)
], UpdateLeadDto.prototype, "priority", void 0);
//# sourceMappingURL=update-lead.dto.js.map