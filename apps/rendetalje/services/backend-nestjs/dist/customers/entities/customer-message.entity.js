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
exports.CustomerMessage = void 0;
const swagger_1 = require("@nestjs/swagger");
const base_entity_1 = require("../../common/entities/base.entity");
class CustomerMessage extends base_entity_1.OrganizationEntity {
}
exports.CustomerMessage = CustomerMessage;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' }),
    __metadata("design:type", String)
], CustomerMessage.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000003', description: 'Related job ID' }),
    __metadata("design:type", String)
], CustomerMessage.prototype, "job_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000004', description: 'Sender user ID' }),
    __metadata("design:type", String)
], CustomerMessage.prototype, "sender_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'employee', description: 'Type of sender', enum: ['customer', 'employee', 'system'] }),
    __metadata("design:type", String)
], CustomerMessage.prototype, "sender_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'text', description: 'Type of message', enum: ['text', 'photo', 'file'] }),
    __metadata("design:type", String)
], CustomerMessage.prototype, "message_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Hej, hvornår kommer I i dag?', description: 'Message content' }),
    __metadata("design:type", String)
], CustomerMessage.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Message attachments',
        example: ['https://example.com/photo1.jpg', 'https://example.com/document.pdf']
    }),
    __metadata("design:type", Array)
], CustomerMessage.prototype, "attachments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Whether message has been read' }),
    __metadata("design:type", Boolean)
], CustomerMessage.prototype, "is_read", void 0);
//# sourceMappingURL=customer-message.entity.js.map