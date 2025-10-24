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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customers_service_1 = require("./customers.service");
const dto_1 = require("./dto");
const customer_entity_1 = require("./entities/customer.entity");
const customer_message_entity_1 = require("./entities/customer-message.entity");
const customer_review_entity_1 = require("./entities/customer-review.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const api_paginated_response_decorator_1 = require("../common/decorators/api-paginated-response.decorator");
let CustomersController = class CustomersController {
    constructor(customersService) {
        this.customersService = customersService;
    }
    async create(createCustomerDto, req) {
        return this.customersService.create(createCustomerDto, req.user.organizationId);
    }
    async findAll(filters, req) {
        return this.customersService.findAllWithFilters(req.user.organizationId, filters);
    }
    async getAnalytics(timeRange = '30d', req) {
        return this.customersService.getCustomerAnalytics(req.user.organizationId, timeRange);
    }
    async getSatisfactionMetrics(req) {
        return this.customersService.getCustomerSatisfactionMetrics(req.user.organizationId);
    }
    async findOne(id, req) {
        return this.customersService.findById(id, req.user.organizationId);
    }
    async getHistory(id, req) {
        return this.customersService.getCustomerHistory(id, req.user.organizationId);
    }
    async getMessages(id, jobId, req) {
        return this.customersService.getCustomerMessages(id, req.user.organizationId, jobId);
    }
    async createMessage(createMessageDto, req) {
        return this.customersService.createMessage(createMessageDto, req.user.organizationId, req.user.id);
    }
    async markMessageAsRead(messageId, req) {
        return this.customersService.markMessageAsRead(messageId, req.user.organizationId);
    }
    async getReviews(id, req) {
        return this.customersService.getCustomerReviews(id, req.user.organizationId);
    }
    async createReview(id, createReviewDto, req) {
        return this.customersService.createReview(createReviewDto, id, req.user.organizationId);
    }
    async update(id, updateCustomerDto, req) {
        return this.customersService.update(id, updateCustomerDto, req.user.organizationId);
    }
    async deactivate(id, req) {
        return this.customersService.deactivateCustomer(id, req.user.organizationId);
    }
    async activate(id, req) {
        return this.customersService.activateCustomer(id, req.user.organizationId);
    }
    async remove(id, req) {
        return this.customersService.delete(id, req.user.organizationId);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new customer' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Customer created successfully', type: customer_entity_1.Customer }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCustomerDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get all customers with filters and pagination' }),
    (0, api_paginated_response_decorator_1.ApiPaginatedResponse)(customer_entity_1.Customer),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CustomerFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer analytics and insights' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer analytics retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)('timeRange')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('satisfaction-metrics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer satisfaction metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Satisfaction metrics retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getSatisfactionMetrics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer retrieved successfully', type: customer_entity_1.Customer }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer service history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer history retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer messages' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer messages retrieved successfully', type: [customer_message_entity_1.CustomerMessage] }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('job_id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Send message to customer' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent successfully', type: customer_message_entity_1.CustomerMessage }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createMessage", null);
__decorate([
    (0, common_1.Patch)('messages/:messageId/read'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Mark message as read' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Message marked as read' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "markMessageAsRead", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer reviews' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer reviews retrieved successfully', type: [customer_review_entity_1.CustomerReview] }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Post)(':id/reviews'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Create customer review' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Review created successfully', type: customer_review_entity_1.CustomerReview }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateReviewDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createReview", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update customer' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer updated successfully', type: customer_entity_1.Customer }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCustomerDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate customer' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer deactivated successfully', type: customer_entity_1.Customer }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Activate customer' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer activated successfully', type: customer_entity_1.Customer }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "activate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete customer' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Customer deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "remove", null);
exports.CustomersController = CustomersController = __decorate([
    (0, swagger_1.ApiTags)('Customers'),
    (0, common_1.Controller)('customers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map