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
exports.CreateTeamMemberDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateTeamMemberDto {
}
exports.CreateTeamMemberDto = CreateTeamMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clxxx...', description: 'Associated user ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'EMP-2024-0001', description: 'Employee ID (auto-generated if not provided)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Employee skills',
        example: ['standard_cleaning', 'deep_cleaning', 'window_cleaning']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateTeamMemberDto.prototype, "skills", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 250.00, description: 'Hourly rate in DKK' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTeamMemberDto.prototype, "hourlyRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Weekly availability schedule',
        example: {
            monday: { start: '08:00', end: '16:00', available: true },
            tuesday: { start: '08:00', end: '16:00', available: true },
            wednesday: { start: '08:00', end: '16:00', available: true },
            thursday: { start: '08:00', end: '16:00', available: true },
            friday: { start: '08:00', end: '16:00', available: true },
            saturday: { start: '09:00', end: '14:00', available: false },
            sunday: { start: '09:00', end: '14:00', available: false }
        }
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTeamMemberDto.prototype, "availability", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15', description: 'Hire date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "hireDate", void 0);
//# sourceMappingURL=create-team-member.dto.js.map