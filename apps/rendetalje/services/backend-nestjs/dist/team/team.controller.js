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
const api_paginated_response_decorator_1 = require("../common/decorators/api-paginated-response.decorator");
let TeamController = class TeamController {
    constructor(teamService) {
        this.teamService = teamService;
    }
    async createMember(createTeamMemberDto) {
        return this.teamService.create(createTeamMemberDto);
    }
    async findAllMembers(filters) {
        return this.teamService.findAllWithFilters(filters);
    }
    async findMemberById(id) {
        return this.teamService.findById(id);
    }
    async updateMember(id, updateTeamMemberDto) {
        return this.teamService.update(id, updateTeamMemberDto);
    }
    async deactivateMember(id) {
        return this.teamService.deactivate(id);
    }
    async activateMember(id) {
        return this.teamService.activate(id);
    }
    async removeMember(id) {
        return this.teamService.remove(id);
    }
    async getMemberSchedule(id, dateFrom, dateTo) {
        return this.teamService.getTeamMemberSchedule(id, dateFrom, dateTo);
    }
    async getMemberPerformance(id) {
        return this.teamService.getTeamMemberPerformance(id);
    }
    async createTimeEntry(createTimeEntryDto) {
        return this.teamService.createTimeEntry(createTimeEntryDto);
    }
    async findAllTimeEntries(filters) {
        return this.teamService.findTimeEntries(filters);
    }
    async findTimeEntryById(id) {
        return this.teamService.findTimeEntryById(id);
    }
    async updateTimeEntry(id, updateTimeEntryDto) {
        return this.teamService.updateTimeEntry(id, updateTimeEntryDto);
    }
    async deleteTimeEntry(id) {
        return this.teamService.deleteTimeEntry(id);
    }
};
exports.TeamController = TeamController;
__decorate([
    (0, common_1.Post)('members'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new team member' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Team member created successfully', type: team_member_entity_1.TeamMember }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTeamMemberDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "createMember", null);
__decorate([
    (0, common_1.Get)('members'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all team members with filters and pagination' }),
    (0, api_paginated_response_decorator_1.ApiPaginatedResponse)(team_member_entity_1.TeamMember),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TeamFiltersDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findAllMembers", null);
__decorate([
    (0, common_1.Get)('members/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get team member by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member retrieved successfully', type: team_member_entity_1.TeamMember }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findMemberById", null);
__decorate([
    (0, common_1.Patch)('members/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update team member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member updated successfully', type: team_member_entity_1.TeamMember }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTeamMemberDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Post)('members/:id/deactivate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate team member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member deactivated successfully', type: team_member_entity_1.TeamMember }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "deactivateMember", null);
__decorate([
    (0, common_1.Post)('members/:id/activate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Activate team member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member activated successfully', type: team_member_entity_1.TeamMember }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "activateMember", null);
__decorate([
    (0, common_1.Delete)('members/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete team member' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Team member deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)('members/:id/schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Get team member schedule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member schedule retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('dateFrom')),
    __param(2, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getMemberSchedule", null);
__decorate([
    (0, common_1.Get)('members/:id/performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get team member performance metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member performance metrics retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Team member not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getMemberPerformance", null);
__decorate([
    (0, common_1.Post)('time-entries'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new time entry' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Time entry created successfully', type: time_entry_entity_1.TimeEntry }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTimeEntryDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "createTimeEntry", null);
__decorate([
    (0, common_1.Get)('time-entries'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all time entries with filters and pagination' }),
    (0, api_paginated_response_decorator_1.ApiPaginatedResponse)(time_entry_entity_1.TimeEntry),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TimeEntryFiltersDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findAllTimeEntries", null);
__decorate([
    (0, common_1.Get)('time-entries/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get time entry by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time entry retrieved successfully', type: time_entry_entity_1.TimeEntry }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time entry not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findTimeEntryById", null);
__decorate([
    (0, common_1.Patch)('time-entries/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update time entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time entry updated successfully', type: time_entry_entity_1.TimeEntry }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time entry not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTimeEntryDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "updateTimeEntry", null);
__decorate([
    (0, common_1.Delete)('time-entries/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete time entry' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Time entry deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time entry not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "deleteTimeEntry", null);
exports.TeamController = TeamController = __decorate([
    (0, swagger_1.ApiTags)('Team'),
    (0, common_1.Controller)('team'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [team_service_1.TeamService])
], TeamController);
//# sourceMappingURL=team.controller.js.map