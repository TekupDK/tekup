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
exports.TimeCorrectionsController = exports.TimeTrackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const time_tracking_service_1 = require("./time-tracking.service");
const dto_1 = require("./dto");
const time_entry_entity_1 = require("./entities/time-entry.entity");
const time_correction_entity_1 = require("./entities/time-correction.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const api_paginated_response_decorator_1 = require("../common/decorators/api-paginated-response.decorator");
let TimeTrackingController = class TimeTrackingController {
    constructor(timeTrackingService) {
        this.timeTrackingService = timeTrackingService;
    }
    async create(createTimeEntryDto, req) {
        return this.timeTrackingService.create(createTimeEntryDto, req.user.organizationId);
    }
    async findAll(filters, req) {
        return this.timeTrackingService.findAllWithFilters(req.user.organizationId, filters);
    }
    async getDailySummary(employeeId, date, req) {
        return this.timeTrackingService.getDailySummary(employeeId, date, req.user.organizationId);
    }
    async getOvertimeReport(startDate, endDate, req) {
        return this.timeTrackingService.getOvertimeReport(startDate, endDate, req.user.organizationId);
    }
    async findOne(id, req) {
        return this.timeTrackingService.findById(id, req.user.organizationId);
    }
    async update(id, updateTimeEntryDto, req) {
        return this.timeTrackingService.update(id, updateTimeEntryDto, req.user.organizationId);
    }
    async remove(id, req) {
        return this.timeTrackingService.delete(id, req.user.organizationId);
    }
};
exports.TimeTrackingController = TimeTrackingController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new time entry' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Time entry created successfully', type: time_entry_entity_1.TimeEntry }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTimeEntryDto, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get time entries with filters' }),
    (0, api_paginated_response_decorator_1.ApiPaginatedResponse)(time_entry_entity_1.TimeEntry),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TimeEntryFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('daily-summary'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily time summary for employee' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daily summary retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)('employee_id')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "getDailySummary", null);
__decorate([
    (0, common_1.Get)('overtime-report'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get overtime report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Overtime report retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "getOvertimeReport", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get time entry by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time entry retrieved successfully', type: time_entry_entity_1.TimeEntry }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time entry not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Update time entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time entry updated successfully', type: time_entry_entity_1.TimeEntry }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time entry not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTimeEntryDto, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete time entry' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Time entry deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time entry not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "remove", null);
exports.TimeTrackingController = TimeTrackingController = __decorate([
    (0, swagger_1.ApiTags)('Time Tracking'),
    (0, common_1.Controller)('time-entries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [time_tracking_service_1.TimeTrackingService])
], TimeTrackingController);
let TimeCorrectionsController = class TimeCorrectionsController {
    constructor(timeTrackingService) {
        this.timeTrackingService = timeTrackingService;
    }
    async create(createTimeCorrectionDto, req) {
        return this.timeTrackingService.createCorrection(createTimeCorrectionDto, req.user.organizationId, req.user.id);
    }
    async findAll(employeeId, status, date, req = {}) {
        return this.timeTrackingService.getCorrections(req.user.organizationId, employeeId, status, date);
    }
    async approve(id, req) {
        return this.timeTrackingService.approveCorrection(id, req.user.organizationId, req.user.id);
    }
    async reject(id, reason, req) {
        return this.timeTrackingService.rejectCorrection(id, reason, req.user.organizationId, req.user.id);
    }
};
exports.TimeCorrectionsController = TimeCorrectionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Submit time entry correction' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Time correction submitted successfully', type: time_correction_entity_1.TimeCorrection }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTimeCorrectionDto, Object]),
    __metadata("design:returntype", Promise)
], TimeCorrectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get time corrections' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time corrections retrieved successfully', type: [time_correction_entity_1.TimeCorrection] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)('employee_id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('date')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TimeCorrectionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Approve time correction' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time correction approved successfully', type: time_correction_entity_1.TimeCorrection }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time correction not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeCorrectionsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reject time correction' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time correction rejected successfully', type: time_correction_entity_1.TimeCorrection }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time correction not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TimeCorrectionsController.prototype, "reject", null);
exports.TimeCorrectionsController = TimeCorrectionsController = __decorate([
    (0, swagger_1.ApiTags)('Time Corrections'),
    (0, common_1.Controller)('time-corrections'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [time_tracking_service_1.TimeTrackingService])
], TimeCorrectionsController);
//# sourceMappingURL=time-tracking.controller.js.map