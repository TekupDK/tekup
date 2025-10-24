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
exports.UpdatePrivacyPolicyDto = exports.RequestDataDeletionDto = exports.RecordConsentDto = exports.GdprController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const gdpr_service_1 = require("./gdpr.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let GdprController = class GdprController {
    constructor(gdprService) {
        this.gdprService = gdprService;
    }
    async requestDataExport(req) {
        const userId = req.user.sub;
        const email = req.user.email;
        return this.gdprService.requestDataExport(userId, email);
    }
    async getDataExportStatus(req) {
        const userId = req.user.sub;
        const email = req.user.email;
        return this.gdprService.requestDataExport(userId, email);
    }
    async requestDataDeletion(req, reason) {
        const userId = req.user.sub;
        const email = req.user.email;
        return this.gdprService.requestDataDeletion(userId, email, reason);
    }
    async cancelDataDeletion(req) {
        const userId = req.user.sub;
        const success = await this.gdprService.cancelDataDeletion(userId);
        return { success };
    }
    async recordConsent(req, consentType, granted, version) {
        const userId = req.user.sub;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        return this.gdprService.recordConsent(userId, consentType, granted, ipAddress, userAgent, version || '1.0');
    }
    async getConsentStatus(req, consentType) {
        const userId = req.user.sub;
        return this.gdprService.getConsentStatus(userId, consentType);
    }
    async getPrivacyPolicy(version) {
        return this.gdprService.getPrivacyPolicy(version);
    }
    async updatePrivacyPolicy(content, version) {
        await this.gdprService.updatePrivacyPolicy(content, version);
        return { success: true };
    }
    async cleanupExpiredData() {
        await this.gdprService.cleanupExpiredData();
        return { success: true };
    }
    async processScheduledDeletions() {
        await this.gdprService.processScheduledDeletions();
        return { success: true };
    }
};
exports.GdprController = GdprController;
__decorate([
    (0, common_1.Post)('data-export'),
    (0, swagger_1.ApiOperation)({ summary: 'Request data export (Right to Data Portability)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Data export request created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "requestDataExport", null);
__decorate([
    (0, common_1.Get)('data-export/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get data export request status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Export status retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "getDataExportStatus", null);
__decorate([
    (0, common_1.Post)('data-deletion'),
    (0, swagger_1.ApiOperation)({ summary: 'Request data deletion (Right to be Forgotten)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Data deletion request created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "requestDataDeletion", null);
__decorate([
    (0, common_1.Delete)('data-deletion'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel data deletion request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data deletion request cancelled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "cancelDataDeletion", null);
__decorate([
    (0, common_1.Post)('consent'),
    (0, swagger_1.ApiOperation)({ summary: 'Record user consent' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Consent recorded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('consentType')),
    __param(2, (0, common_1.Body)('granted')),
    __param(3, (0, common_1.Body)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean, String]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "recordConsent", null);
__decorate([
    (0, common_1.Get)('consent'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user consent status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Consent status retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "getConsentStatus", null);
__decorate([
    (0, common_1.Get)('privacy-policy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current privacy policy' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Privacy policy retrieved successfully' }),
    __param(0, (0, common_1.Query)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "getPrivacyPolicy", null);
__decorate([
    (0, common_1.Post)('privacy-policy'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update privacy policy (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Privacy policy updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    __param(0, (0, common_1.Body)('content')),
    __param(1, (0, common_1.Body)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "updatePrivacyPolicy", null);
__decorate([
    (0, common_1.Post)('cleanup-expired'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Cleanup expired data (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Expired data cleanup completed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "cleanupExpiredData", null);
__decorate([
    (0, common_1.Post)('process-deletions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Process scheduled deletions (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Scheduled deletions processed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "processScheduledDeletions", null);
exports.GdprController = GdprController = __decorate([
    (0, swagger_1.ApiTags)('GDPR'),
    (0, common_1.Controller)('gdpr'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [gdpr_service_1.GdprService])
], GdprController);
class RecordConsentDto {
}
exports.RecordConsentDto = RecordConsentDto;
class RequestDataDeletionDto {
}
exports.RequestDataDeletionDto = RequestDataDeletionDto;
class UpdatePrivacyPolicyDto {
}
exports.UpdatePrivacyPolicyDto = UpdatePrivacyPolicyDto;
//# sourceMappingURL=gdpr.controller.js.map