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
exports.TeamController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const team_service_1 = require("./team.service");
const dto_1 = require("./dto");
const team_member_entity_1 = require("./entities/team-member.entity");
const time_entry_entity_1 = require("./entities/time-entry.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const api_paginated_response_decorator_1 = require("../common/decorators/api-paginated-response.decorator");
let TeamController = class TeamController {
    constructor(teamService) {
        this.teamService = teamService;
    }
    async createMember(createTeamMemberDto, req) {
        return this.teamService.create(createTeamMemberDto, req.user.organizationId);
    }
    async findAllMembers(filters, req) {
        return this.teamService.findAllWithFilters(req.user.organizationId, filters);
    }
    async getPerformanceReport(req) {
        return this.teamService.getTeamPerformanceReport(req.user.organizationId);
    }
    async findOneMember(id, req) {
        return this.teamService.findById(id, req.user.organizationId);
    }
    async getMemberSchedule(id, dateFrom, dateTo, req) {
        return this.teamService.getTeamMemberSchedule(id, req.user.organizationId, dateFrom, dateTo);
    }
    async getMemberPerformance(id, req) {
        return this.teamService.getTeamMemberPerformance(id, req.user.organizationId);
    }
    async updateMember(id, updateTeamMemberDto, req) {
        return this.teamService.update(id, updateTeamMemberDto, req.user.organizationId);
    }
    async removeMember(id, req) {
        return this.teamService.delete(id, req.user.organizationId);
    }
    async createTimeEntry(createTimeEntryDto, req) {
        return this.teamService.createTimeEntry(createTimeEntryDto, req.user.organizationId);
    }
    async findAllTimeEntries(filters, req) {
        return this.teamService.findTimeEntries(req.user.organizationId, filters);
    }
    async updateTimeEntry(id, updateTimeEntryDto, req) {
        return this.teamService.updateTimeEntry(id, updateTimeEntryDto, req.user.organizationId);
    }
    async removeTimeEntry(id, req) {
        return this.teamService.deleteTimeEntry(id, req.user.organizationId);
    }
};
exports.TeamController = TeamController;
__decorate([
    (0, common_1.Post)('members'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new team member' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Team member created successfully', type: team_member_entity_1.TeamMember }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTeamMemberDto, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "createMember", null);
__decorate([
    (0, common_1.Get)('members'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get all team members with filters and pagination' }),
    (0, api_paginated_response_decorator_1.ApiPaginatedResponse)(team_member_entity_1.TeamMember),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TeamFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findAllMembers", null);
__decorate([
    (0, common_1.Get)('performance-report'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get team performance report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team performance report retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getPerformanceReport", null);
__decorate([
    (0, common_1.Get)('members/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get team member by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member retrieved successfully', type: team_member_entity_1.TeamMember }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findOneMember", null);
__decorate([
    (0, common_1.Get)('members/:id/schedule'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get team member schedule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member schedule retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date_from')),
    __param(2, (0, common_1.Query)('date_to')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getMemberSchedule", null);
__decorate([
    (0, common_1.Get)('members/:id/performance'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get team member performance metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member performance retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getMemberPerformance", null);
__decorate([
    (0, common_1.Patch)('members/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update team member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member updated successfully', type: team_member_entity_1.TeamMember }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTeamMemberDto, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Delete)('members/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete team member' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Team member deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)('time-entries'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new time entry' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Time entry created successfully', type: time_entry_entity_1.TimeEntry }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTimeEntryDto, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "createTimeEntry", null);
__decorate([
    (0, common_1.Get)('time-entries'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get all time entries with filters and pagination' }),
    (0, api_paginated_response_decorator_1.ApiPaginatedResponse)(time_entry_entity_1.TimeEntry),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TimeEntryFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findAllTimeEntries", null);
__decorate([
    (0, common_1.Patch)('time-entries/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
    (0, swagger_1.ApiOperation)({ summary: 'Update time entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time entry updated successfully', type: time_entry_entity_1.TimeEntry }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time entry not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTimeEntryDto, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "updateTimeEntry", null);
__decorate([
    (0, common_1.Delete)('time-entries/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.EMPLOYEE),
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
], TeamController.prototype, "removeTimeEntry", null);
exports.TeamController = TeamController = __decorate([
    (0, swagger_1.ApiTags)('Team'),
    (0, common_1.Controller)('team'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [team_service_1.TeamService])
], TeamController);
//# sourceMappingURL=team.controller.js.map