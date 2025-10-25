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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const integration_service_1 = require("./integration.service");
const tekup_billy_service_1 = require("./tekup-billy/tekup-billy.service");
const tekup_vault_service_1 = require("./tekup-vault/tekup-vault.service");
const renos_calendar_service_1 = require("./renos-calendar/renos-calendar.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let IntegrationsController = class IntegrationsController {
    constructor(integrationService, tekupBillyService, tekupVaultService, renosCalendarService) {
        this.integrationService = integrationService;
        this.tekupBillyService = tekupBillyService;
        this.tekupVaultService = tekupVaultService;
        this.renosCalendarService = renosCalendarService;
    }
    async getHealthStatus() {
        const health = this.integrationService.getAllServicesHealth();
        const serviceChecks = await Promise.allSettled([
            this.tekupBillyService.healthCheck(),
            this.tekupVaultService.healthCheck(),
            this.renosCalendarService.healthCheck(),
        ]);
        return {
            overall: health,
            services: {
                'tekup-billy': {
                    ...health['tekup-billy'],
                    connectivity: serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : false,
                },
                'tekup-vault': {
                    ...health['tekup-vault'],
                    connectivity: serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : false,
                },
                'renos-calendar': {
                    ...health['renos-calendar'],
                    connectivity: serviceChecks[2].status === 'fulfilled' ? serviceChecks[2].value : false,
                },
            },
        };
    }
    async searchBillyCustomers(query) {
        return this.tekupBillyService.searchCustomers(query);
    }
    async getBillyProducts() {
        return this.tekupBillyService.getProducts();
    }
    async createBillyInvoice(invoiceData) {
        return this.tekupBillyService.createInvoice(invoiceData);
    }
    async getBillyInvoice(id) {
        return this.tekupBillyService.getInvoice(id);
    }
    async sendBillyInvoice(id, email) {
        return this.tekupBillyService.sendInvoice(id, email);
    }
    async getBillyFinancialReport(dateFrom, dateTo) {
        return this.tekupBillyService.getFinancialReport(dateFrom, dateTo);
    }
    async handleBillyWebhook(webhookData) {
        return this.tekupBillyService.handleWebhook(webhookData);
    }
    async searchVault(searchQuery) {
        return this.tekupVaultService.search(searchQuery);
    }
    async getVaultFAQs(category) {
        return this.tekupVaultService.getFAQs(category);
    }
    async getVaultProcedures(category) {
        return this.tekupVaultService.getProcedures(category);
    }
    async createVaultDocument(documentData) {
        return this.tekupVaultService.createDocument(documentData);
    }
    async getTrainingMaterials() {
        return this.tekupVaultService.getTrainingMaterials();
    }
    async getVaultSearchAnalytics(dateFrom, dateTo) {
        return this.tekupVaultService.getSearchAnalytics(dateFrom, dateTo);
    }
    async checkCalendarAvailability(query) {
        return this.renosCalendarService.checkAvailability(query);
    }
    async detectCalendarConflicts(eventData) {
        return this.renosCalendarService.detectConflicts(eventData);
    }
    async getCalendarEvents(startDate, endDate, teamMemberId) {
        return this.renosCalendarService.getEvents(startDate, endDate, teamMemberId);
    }
    async getOvertimeAlerts(req) {
        return this.renosCalendarService.getOvertimeAlerts(req.user.organizationId);
    }
    async getCustomerMemory(customerId) {
        return this.renosCalendarService.getCustomerMemory(customerId);
    }
    async getOptimalSchedule(scheduleData) {
        return this.renosCalendarService.suggestOptimalSchedule(scheduleData.jobs, scheduleData.teamMembers, scheduleData.constraints);
    }
    async calculateTravelTime(travelData) {
        return this.renosCalendarService.calculateTravelTime(travelData.from, travelData.to, travelData.mode);
    }
    async createInvoiceFromJob(jobId, jobData) {
        return this.tekupBillyService.createInvoiceFromJob(jobData.job, jobData.customer);
    }
    async scheduleJob(jobId, scheduleData) {
        return this.renosCalendarService.scheduleJob(scheduleData.job, scheduleData.teamMemberIds);
    }
    async searchCustomerSupport(query) {
        return this.tekupVaultService.searchCustomerSupport(query);
    }
    async searchCleaningProcedures(query) {
        return this.tekupVaultService.searchCleaningProcedures(query);
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)('health'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get integration health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Integration health status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getHealthStatus", null);
__decorate([
    (0, common_1.Get)('billy/customers/search'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Search customers in Billy.dk' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "searchBillyCustomers", null);
__decorate([
    (0, common_1.Get)('billy/products'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get products from Billy.dk' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getBillyProducts", null);
__decorate([
    (0, common_1.Post)('billy/invoices'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create invoice in Billy.dk' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "createBillyInvoice", null);
__decorate([
    (0, common_1.Get)('billy/invoices/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoice from Billy.dk' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getBillyInvoice", null);
__decorate([
    (0, common_1.Post)('billy/invoices/:id/send'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Send invoice via Billy.dk' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "sendBillyInvoice", null);
__decorate([
    (0, common_1.Get)('billy/reports/financial'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get financial report from Billy.dk' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getBillyFinancialReport", null);
__decorate([
    (0, common_1.Post)('billy/webhooks'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle Billy.dk webhooks' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "handleBillyWebhook", null);
__decorate([
    (0, common_1.Post)('vault/search'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Search knowledge base' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "searchVault", null);
__decorate([
    (0, common_1.Get)('vault/faqs'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get FAQs from knowledge base' }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getVaultFAQs", null);
__decorate([
    (0, common_1.Get)('vault/procedures'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get procedures from knowledge base' }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getVaultProcedures", null);
__decorate([
    (0, common_1.Post)('vault/documents'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create document in knowledge base' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "createVaultDocument", null);
__decorate([
    (0, common_1.Get)('vault/training-materials'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get training materials' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getTrainingMaterials", null);
__decorate([
    (0, common_1.Get)('vault/analytics/search'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get search analytics' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getVaultSearchAnalytics", null);
__decorate([
    (0, common_1.Post)('calendar/availability/check'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Check availability' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "checkCalendarAvailability", null);
__decorate([
    (0, common_1.Post)('calendar/conflicts/detect'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Detect scheduling conflicts' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "detectCalendarConflicts", null);
__decorate([
    (0, common_1.Get)('calendar/events'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get calendar events' }),
    __param(0, (0, common_1.Query)('start')),
    __param(1, (0, common_1.Query)('end')),
    __param(2, (0, common_1.Query)('teamMemberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getCalendarEvents", null);
__decorate([
    (0, common_1.Get)('calendar/overtime/alerts'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get overtime alerts' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getOvertimeAlerts", null);
__decorate([
    (0, common_1.Get)('calendar/customers/:id/memory'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer memory' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getCustomerMemory", null);
__decorate([
    (0, common_1.Post)('calendar/schedule/optimize'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get optimal schedule suggestions' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "getOptimalSchedule", null);
__decorate([
    (0, common_1.Post)('calendar/travel/calculate'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate travel time' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "calculateTravelTime", null);
__decorate([
    (0, common_1.Post)('billy/jobs/:jobId/invoice'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create invoice from job' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "createInvoiceFromJob", null);
__decorate([
    (0, common_1.Post)('calendar/jobs/:jobId/schedule'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Schedule job in calendar' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "scheduleJob", null);
__decorate([
    (0, common_1.Post)('vault/support/search'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Search customer support knowledge base' }),
    __param(0, (0, common_1.Body)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "searchCustomerSupport", null);
__decorate([
    (0, common_1.Post)('vault/procedures/cleaning/search'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Search cleaning procedures' }),
    __param(0, (0, common_1.Body)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "searchCleaningProcedures", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, swagger_1.ApiTags)('Integrations'),
    (0, common_1.Controller)('integrations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService,
        tekup_billy_service_1.TekupBillyService,
        tekup_vault_service_1.TekupVaultService,
        renos_calendar_service_1.RenosCalendarService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map