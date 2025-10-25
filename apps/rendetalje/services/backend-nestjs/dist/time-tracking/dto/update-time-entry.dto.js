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
exports.UpdateTimeEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const create_time_entry_dto_1 = require("./create-time-entry.dto");
class UpdateTimeEntryDto extends (0, swagger_1.PartialType)(create_time_entry_dto_1.CreateTimeEntryDto) {
}
exports.UpdateTimeEntryDto = UpdateTimeEntryDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: '2024-01-15T17:00:00Z', description: 'End time of work' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateTimeEntryDto.prototype, "end_time", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 30, description: 'Break duration in minutes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateTimeEntryDto.prototype, "break_duration", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Completed all tasks successfully', description: 'Updated notes about the work' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTimeEntryDto.prototype, "notes", void 0);
//# sourceMappingURL=update-time-entry.dto.js.map