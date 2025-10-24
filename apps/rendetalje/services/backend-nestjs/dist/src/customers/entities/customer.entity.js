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
exports.Customer = void 0;
const swagger_1 = require("@nestjs/swagger");
const base_entity_1 = require("../../common/entities/base.entity");
class Customer extends base_entity_1.OrganizationEntity {
}
exports.Customer = Customer;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '00000000-0000-0000-0000-000000000001', description: 'Associated user ID (if customer has login)' }),
    __metadata("design:type", String)
], Customer.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe', description: 'Customer full name' }),
    __metadata("design:type", String)
], Customer.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'john.doe@example.com', description: 'Customer email address' }),
    __metadata("design:type", String)
], Customer.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+45 12 34 56 78', description: 'Customer phone number' }),
    __metadata("design:type", String)
], Customer.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Customer address',
        example: {
            street: 'Hovedgade 123',
            city: 'København',
            postal_code: '1000',
            country: 'Denmark'
        }
    }),
    __metadata("design:type", Object)
], Customer.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Customer preferences',
        example: {
            preferred_time: 'morning',
            special_instructions: 'Ring på før ankomst',
            key_location: 'Under dørmåtten',
            contact_method: 'phone'
        }
    }),
    __metadata("design:type", Object)
], Customer.prototype, "preferences", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15, description: 'Total number of completed jobs' }),
    __metadata("design:type", Number)
], Customer.prototype, "total_jobs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 18500.50, description: 'Total revenue from customer' }),
    __metadata("design:type", Number)
], Customer.prototype, "total_revenue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 4.5, description: 'Average satisfaction score (1-5)' }),
    __metadata("design:type", Number)
], Customer.prototype, "satisfaction_score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'VIP customer, always pays on time', description: 'Internal notes about customer' }),
    __metadata("design:type", String)
], Customer.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether customer is active' }),
    __metadata("design:type", Boolean)
], Customer.prototype, "is_active", void 0);
//# sourceMappingURL=customer.entity.js.map