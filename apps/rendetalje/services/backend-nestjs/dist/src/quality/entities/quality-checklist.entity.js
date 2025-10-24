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
exports.QualityChecklist = void 0;
const swagger_1 = require("@nestjs/swagger");
const base_entity_1 = require("../../common/entities/base.entity");
const job_entity_1 = require("../../jobs/entities/job.entity");
class QualityChecklist extends base_entity_1.OrganizationEntity {
}
exports.QualityChecklist = QualityChecklist;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: job_entity_1.ServiceType, example: job_entity_1.ServiceType.STANDARD, description: 'Service type this checklist applies to' }),
    __metadata("design:type", String)
], QualityChecklist.prototype, "service_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Standard Cleaning Checklist', description: 'Checklist name' }),
    __metadata("design:type", String)
], QualityChecklist.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Comprehensive checklist for standard cleaning services', description: 'Checklist description' }),
    __metadata("design:type", String)
], QualityChecklist.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Checklist items',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                required: { type: 'boolean' },
                photo_required: { type: 'boolean' },
                order: { type: 'number' },
                category: { type: 'string' },
                points: { type: 'number' }
            }
        }
    }),
    __metadata("design:type", Array)
], QualityChecklist.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether checklist is active' }),
    __metadata("design:type", Boolean)
], QualityChecklist.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Checklist version number' }),
    __metadata("design:type", Number)
], QualityChecklist.prototype, "version", void 0);
//# sourceMappingURL=quality-checklist.entity.js.map