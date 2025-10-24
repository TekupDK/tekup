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
exports.TimeTrackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const time_tracking_service_1 = require("./time-tracking.service");
const create_time_correction_dto_1 = require("./dto/create-time-correction.dto");
const time_correction_entity_1 = require("./entities/time-correction.entity");
let TimeTrackingController = class TimeTrackingController {
    constructor(timeTrackingService) {
        this.timeTrackingService = timeTrackingService;
    }
    async getCorrections(employeeId, status, startDate, endDate) {
        return this.timeTrackingService.getCorrections(employeeId, status, startDate, endDate);
    }
    async getCorrectionById(id) {
        return this.timeTrackingService.getCorrectionById(id);
    }
    async createCorrection(req, dto) {
        return this.timeTrackingService.createCorrection(dto, req.user.id);
    }
    async approveCorrection(req, id) {
        return this.timeTrackingService.approveCorrection(id, req.user.id);
    }
    async rejectCorrection(req, id, rejectionReason) {
        return this.timeTrackingService.rejectCorrection(id, rejectionReason, req.user.id);
    }
    async getOvertimeReport(startDate, endDate) {
        return this.timeTrackingService.getOvertimeReport(startDate, endDate);
    }
};
exports.TimeTrackingController = TimeTrackingController;
__decorate([
    (0, common_1.Get)('corrections'),
    (0, swagger_1.ApiOperation)({ summary: 'Get time corrections with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of time corrections', type: [time_correction_entity_1.TimeCorrection] }),
    (0, swagger_1.ApiQuery)({ name: 'employeeId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    __param(0, (0, common_1.Query)('employeeId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "getCorrections", null);
__decorate([
    (0, common_1.Get)('corrections/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a time correction by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time correction details', type: time_correction_entity_1.TimeCorrection }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time correction not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "getCorrectionById", null);
__decorate([
    (0, common_1.Post)('corrections'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a time correction request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Time correction created', type: time_correction_entity_1.TimeCorrection }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Original time entry not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_time_correction_dto_1.CreateTimeCorrectionDto]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "createCorrection", null);
__decorate([
    (0, common_1.Post)('corrections/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a time correction (managers only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time correction approved', type: time_correction_entity_1.TimeCorrection }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only pending corrections can be approved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time correction not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "approveCorrection", null);
__decorate([
    (0, common_1.Post)('corrections/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a time correction (managers only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time correction rejected', type: time_correction_entity_1.TimeCorrection }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only pending corrections can be rejected' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time correction not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('rejectionReason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "rejectCorrection", null);
__decorate([
    (0, common_1.Get)('overtime-report'),
    (0, swagger_1.ApiOperation)({ summary: 'Get overtime report for a date range' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Overtime report' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String, example: '2025-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String, example: '2025-01-31' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TimeTrackingController.prototype, "getOvertimeReport", null);
exports.TimeTrackingController = TimeTrackingController = __decorate([
    (0, swagger_1.ApiTags)('time-tracking'),
    (0, common_1.Controller)('time-tracking'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [time_tracking_service_1.TimeTrackingService])
], TimeTrackingController);
//# sourceMappingURL=time-tracking.controller.js.map