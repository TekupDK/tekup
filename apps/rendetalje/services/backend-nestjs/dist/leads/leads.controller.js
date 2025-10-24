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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leads_service_1 = require("./leads.service");
const dto_1 = require("./dto");
const lead_entity_1 = require("./entities/lead.entity");
let LeadsController = class LeadsController {
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    async create(createLeadDto) {
        return this.leadsService.create(createLeadDto);
    }
    async findAll(filters) {
        return this.leadsService.findAll(filters);
    }
    async findOne(id) {
        return this.leadsService.findOne(id);
    }
    async update(id, updateLeadDto) {
        return this.leadsService.update(id, updateLeadDto);
    }
    async remove(id) {
        return this.leadsService.remove(id);
    }
    async enrichLead(id, enrichmentData) {
        return this.leadsService.enrichLead(id, enrichmentData);
    }
    async scoreLead(id, scoreData) {
        return this.leadsService.scoreLead(id, scoreData.score, scoreData.priority, scoreData.metadata);
    }
    async incrementFollowUp(id) {
        return this.leadsService.incrementFollowUpAttempts(id);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new lead' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Lead created successfully', type: lead_entity_1.Lead }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateLeadDto]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all leads with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'priority', required: false, description: 'Filter by priority' }),
    (0, swagger_1.ApiQuery)({ name: 'source', required: false, description: 'Filter by source' }),
    (0, swagger_1.ApiQuery)({ name: 'minEstimatedValue', required: false, description: 'Minimum estimated value' }),
    (0, swagger_1.ApiQuery)({ name: 'minScore', required: false, description: 'Minimum lead score' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search in name, email, phone' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of leads', type: [lead_entity_1.Lead] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LeadFiltersDto]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a lead by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead found', type: lead_entity_1.Lead }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Lead not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a lead' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead updated successfully', type: lead_entity_1.Lead }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Lead not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateLeadDto]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a lead' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Lead deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Lead not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/enrich'),
    (0, swagger_1.ApiOperation)({ summary: 'Enrich lead with external data (Firecrawl)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead enriched successfully', type: lead_entity_1.Lead }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "enrichLead", null);
__decorate([
    (0, common_1.Post)(':id/score'),
    (0, swagger_1.ApiOperation)({ summary: 'Score a lead and set priority' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead scored successfully', type: lead_entity_1.Lead }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "scoreLead", null);
__decorate([
    (0, common_1.Post)(':id/follow-up'),
    (0, swagger_1.ApiOperation)({ summary: 'Increment follow-up attempts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Follow-up attempt recorded', type: lead_entity_1.Lead }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "incrementFollowUp", null);
exports.LeadsController = LeadsController = __decorate([
    (0, swagger_1.ApiTags)('Leads'),
    (0, common_1.Controller)('leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map