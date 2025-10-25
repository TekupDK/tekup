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
exports.JobAssignment = void 0;
const swagger_1 = require("@nestjs/swagger");
const base_entity_1 = require("../../common/entities/base.entity");
class JobAssignment extends base_entity_1.BaseEntity {
}
exports.JobAssignment = JobAssignment;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' }),
    __metadata("design:type", String)
], JobAssignment.prototype, "job_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Team member ID' }),
    __metadata("design:type", String)
], JobAssignment.prototype, "team_member_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'lead', description: 'Role in the job', enum: ['lead', 'cleaner', 'supervisor'] }),
    __metadata("design:type", String)
], JobAssignment.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01T08:00:00.000Z', description: 'Assignment timestamp' }),
    __metadata("design:type", String)
], JobAssignment.prototype, "assigned_at", void 0);
//# sourceMappingURL=job-assignment.entity.js.map