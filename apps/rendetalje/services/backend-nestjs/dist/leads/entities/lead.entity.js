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
exports.Lead = exports.LeadPriority = exports.LeadStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "new";
    LeadStatus["CONTACTED"] = "contacted";
    LeadStatus["QUALIFIED"] = "qualified";
    LeadStatus["CONVERTED"] = "converted";
    LeadStatus["LOST"] = "lost";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var LeadPriority;
(function (LeadPriority) {
    LeadPriority["LOW"] = "low";
    LeadPriority["MEDIUM"] = "medium";
    LeadPriority["HIGH"] = "high";
    LeadPriority["URGENT"] = "urgent";
})(LeadPriority || (exports.LeadPriority = LeadPriority = {}));
class Lead {
}
exports.Lead = Lead;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clw123abc', description: 'Lead ID' }),
    __metadata("design:type", String)
], Lead.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ses_123abc', description: 'Chat session ID' }),
    __metadata("design:type", String)
], Lead.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'cus_123abc', description: 'Customer ID if converted' }),
    __metadata("design:type", String)
], Lead.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'website', description: 'Lead source' }),
    __metadata("design:type", String)
], Lead.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'John Doe', description: 'Lead name' }),
    __metadata("design:type", String)
], Lead.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'john@example.com', description: 'Email address' }),
    __metadata("design:type", String)
], Lead.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+4512345678', description: 'Phone number' }),
    __metadata("design:type", String)
], Lead.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Hovedgade 123, 1000 København', description: 'Address' }),
    __metadata("design:type", String)
], Lead.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 85.5, description: 'Square meters to clean' }),
    __metadata("design:type", Number)
], Lead.prototype, "squareMeters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, description: 'Number of rooms' }),
    __metadata("design:type", Number)
], Lead.prototype, "rooms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'standard', description: 'Type of cleaning task' }),
    __metadata("design:type", String)
], Lead.prototype, "taskType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preferred dates for service',
        type: [String],
        example: ['2024-01-15', '2024-01-16']
    }),
    __metadata("design:type", Array)
], Lead.prototype, "preferredDates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: LeadStatus, example: LeadStatus.NEW, description: 'Lead status' }),
    __metadata("design:type", String)
], Lead.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'thread_abc123', description: 'Email thread ID' }),
    __metadata("design:type", String)
], Lead.prototype, "emailThreadId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Number of follow-up attempts' }),
    __metadata("design:type", Number)
], Lead.prototype, "followUpAttempts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-10T10:00:00Z', description: 'Last follow-up date' }),
    __metadata("design:type", Date)
], Lead.prototype, "lastFollowUpDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'idempotency_key_123', description: 'Idempotency key for deduplication' }),
    __metadata("design:type", String)
], Lead.prototype, "idempotencyKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Acme Corp', description: 'Company name from enrichment' }),
    __metadata("design:type", String)
], Lead.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Technology', description: 'Industry sector' }),
    __metadata("design:type", String)
], Lead.prototype, "industry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '11-50 employees', description: 'Estimated company size' }),
    __metadata("design:type", String)
], Lead.prototype, "estimatedSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5000, description: 'Estimated lead value in DKK' }),
    __metadata("design:type", Number)
], Lead.prototype, "estimatedValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enrichment data from Firecrawl' }),
    __metadata("design:type", Object)
], Lead.prototype, "enrichmentData", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-05T12:00:00Z', description: 'Last enrichment timestamp' }),
    __metadata("design:type", Date)
], Lead.prototype, "lastEnriched", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 75, description: 'Lead score (0-100)' }),
    __metadata("design:type", Number)
], Lead.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: LeadPriority, example: LeadPriority.MEDIUM, description: 'Lead priority' }),
    __metadata("design:type", String)
], Lead.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-06T09:00:00Z', description: 'Last scoring timestamp' }),
    __metadata("design:type", Date)
], Lead.prototype, "lastScored", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metadata used for scoring calculation' }),
    __metadata("design:type", Object)
], Lead.prototype, "scoreMetadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01T00:00:00Z', description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], Lead.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-05T10:30:00Z', description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], Lead.prototype, "updatedAt", void 0);
//# sourceMappingURL=lead.entity.js.map