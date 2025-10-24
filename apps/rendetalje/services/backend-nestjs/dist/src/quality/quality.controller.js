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
exports.QualityController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const quality_service_1 = require("./quality.service");
const quality_checklists_service_1 = require("./quality-checklists.service");
const photo_documentation_service_1 = require("./photo-documentation.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const job_entity_1 = require("../jobs/entities/job.entity");
let QualityController = class QualityController {
    constructor(qualityService, qualityChecklistsService, photoDocumentationService) {
        this.qualityService = qualityService;
        this.qualityChecklistsService = qualityChecklistsService;
        this.photoDocumentationService = photoDocumentationService;
    }
    async createChecklist(createChecklistDto, req) {
        return this.qualityChecklistsService.create(createChecklistDto, req.user.organizationId);
    }
    async getChecklists(req) {
        return this.qualityChecklistsService.findAll(req.user.organizationId, {});
    }
    async getChecklistByServiceType(serviceType, req) {
        return this.qualityChecklistsService.getByServiceType(serviceType, req.user.organizationId);
    }
    async getChecklist(id, req) {
        return this.qualityChecklistsService.findById(id, req.user.organizationId);
    }
    async updateChecklist(id, updates, req) {
        return this.qualityChecklistsService.createNewVersion(id, req.user.organizationId, updates);
    }
    async duplicateChecklist(id, data, req) {
        return this.qualityChecklistsService.duplicateChecklist(id, req.user.organizationId, data.serviceType, data.name);
    }
    async getChecklistVersions(serviceType, req) {
        return this.qualityChecklistsService.getChecklistVersions(serviceType, req.user.organizationId);
    }
    async initializeDefaultChecklists(req) {
        return this.qualityChecklistsService.initializeDefaultChecklists(req.user.organizationId);
    }
    async createAssessment(createAssessmentDto, req) {
        return this.qualityService.createAssessment(createAssessmentDto, req.user.organizationId, req.user.id);
    }
    async getJobAssessment(jobId, req) {
        return this.qualityService.getJobAssessment(jobId, req.user.organizationId);
    }
    async updateAssessment(id, updates, req) {
        return this.qualityService.updateAssessment(id, updates, req.user.organizationId);
    }
    async uploadPhotos(files, metadata, req) {
        const photoMetadata = {
            ...metadata,
            timestamp: new Date().toISOString(),
            uploadedBy: req.user.id,
        };
        const fileData = files.map(file => ({
            buffer: file.buffer,
            filename: file.originalname,
        }));
        return this.photoDocumentationService.uploadMultiplePhotos(fileData, photoMetadata, req.user.organizationId);
    }
    async getJobPhotos(jobId, type, req) {
        return this.photoDocumentationService.getJobPhotos(jobId, req.user.organizationId, type);
    }
    async deletePhoto(photoUrl, req) {
        return this.photoDocumentationService.deletePhoto(photoUrl, req.user.organizationId);
    }
    async comparePhotos(data) {
        return this.photoDocumentationService.comparePhotos(data.beforePhotoUrl, data.afterPhotoUrl);
    }
    async generatePhotoReport(jobId, req) {
        return this.photoDocumentationService.generatePhotoReport(jobId, req.user.organizationId);
    }
    async organizePhotosByDate(dateFrom, dateTo, req) {
        return this.photoDocumentationService.organizePhotosByDate(req.user.organizationId, dateFrom, dateTo);
    }
    async getQualityMetrics(req) {
        return this.qualityService.getOrganizationQualityMetrics(req.user.organizationId);
    }
    async getQualityIssues(severity = 'medium', req) {
        return this.qualityService.getQualityIssues(req.user.organizationId, severity);
    }
    async generateQualityReport(dateFrom, dateTo, req) {
        return this.qualityService.generateQualityReport(req.user.organizationId, dateFrom, dateTo);
    }
    async getChecklistAnalytics(req) {
        return this.qualityChecklistsService.getChecklistAnalytics(req.user.organizationId);
    }
};
exports.QualityController = QualityController;
__decorate([
    (0, common_1.Post)('checklists'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create quality checklist' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Checklist created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateQualityChecklistDto, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "createChecklist", null);
__decorate([
    (0, common_1.Get)('checklists'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get all quality checklists' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getChecklists", null);
__decorate([
    (0, common_1.Get)('checklists/service-type/:serviceType'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get checklist by service type' }),
    __param(0, (0, common_1.Param)('serviceType')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getChecklistByServiceType", null);
__decorate([
    (0, common_1.Get)('checklists/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get checklist by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getChecklist", null);
__decorate([
    (0, common_1.Patch)('checklists/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update checklist (creates new version)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "updateChecklist", null);
__decorate([
    (0, common_1.Post)('checklists/:id/duplicate'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Duplicate checklist for different service type' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "duplicateChecklist", null);
__decorate([
    (0, common_1.Get)('checklists/service-type/:serviceType/versions'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all versions of checklist for service type' }),
    __param(0, (0, common_1.Param)('serviceType')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getChecklistVersions", null);
__decorate([
    (0, common_1.Post)('checklists/initialize-defaults'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize default checklists for all service types' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "initializeDefaultChecklists", null);
__decorate([
    (0, common_1.Post)('assessments'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Create quality assessment for job' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Assessment created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateQualityAssessmentDto, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "createAssessment", null);
__decorate([
    (0, common_1.Get)('assessments/job/:jobId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get quality assessment for job' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getJobAssessment", null);
__decorate([
    (0, common_1.Patch)('assessments/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Update quality assessment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "updateAssessment", null);
__decorate([
    (0, common_1.Post)('photos/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 10)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Upload quality documentation photos' }),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "uploadPhotos", null);
__decorate([
    (0, common_1.Get)('photos/job/:jobId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE, user_role_enum_1.UserRole.CUSTOMER),
    (0, swagger_1.ApiOperation)({ summary: 'Get photos for job' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getJobPhotos", null);
__decorate([
    (0, common_1.Delete)('photos'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete photo' }),
    __param(0, (0, common_1.Body)('photoUrl')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "deletePhoto", null);
__decorate([
    (0, common_1.Post)('photos/compare'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Compare before and after photos' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "comparePhotos", null);
__decorate([
    (0, common_1.Get)('photos/report/job/:jobId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Generate photo report for job' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "generatePhotoReport", null);
__decorate([
    (0, common_1.Get)('photos/organize'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get photos organized by date' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "organizePhotosByDate", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get organization quality metrics' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getQualityMetrics", null);
__decorate([
    (0, common_1.Get)('issues'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get quality issues' }),
    __param(0, (0, common_1.Query)('severity')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getQualityIssues", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Generate comprehensive quality report' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "generateQualityReport", null);
__decorate([
    (0, common_1.Get)('checklists/analytics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get checklist usage analytics' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QualityController.prototype, "getChecklistAnalytics", null);
exports.QualityController = QualityController = __decorate([
    (0, swagger_1.ApiTags)('Quality Control'),
    (0, common_1.Controller)('quality'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [quality_service_1.QualityService,
        quality_checklists_service_1.QualityChecklistsService,
        photo_documentation_service_1.PhotoDocumentationService])
], QualityController);
//# sourceMappingURL=quality.controller.js.map