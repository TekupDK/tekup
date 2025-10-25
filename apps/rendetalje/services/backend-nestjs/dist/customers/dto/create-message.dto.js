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
exports.CreateMessageDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateMessageDto {
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000003', description: 'Related job ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "job_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'employee', description: 'Type of sender', enum: ['customer', 'employee', 'system'] }),
    (0, class_validator_1.IsEnum)(['customer', 'employee', 'system']),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "sender_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'text', description: 'Type of message', enum: ['text', 'photo', 'file'] }),
    (0, class_validator_1.IsEnum)(['text', 'photo', 'file']),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "message_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Hej, hvornår kommer I i dag?', description: 'Message content' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Message attachments',
        example: ['https://example.com/photo1.jpg', 'https://example.com/document.pdf']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMessageDto.prototype, "attachments", void 0);
//# sourceMappingURL=create-message.dto.js.map