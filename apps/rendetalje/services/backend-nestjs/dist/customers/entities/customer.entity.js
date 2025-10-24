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
class Customer {
}
exports.Customer = Customer;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ckl1234567890', description: 'Customer ID' }),
    __metadata("design:type", String)
], Customer.prototype, "id", void 0);
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
    (0, swagger_1.ApiPropertyOptional)({ example: 'Hovedgade 123, 1000 København', description: 'Customer address' }),
    __metadata("design:type", String)
], Customer.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Acme Corporation', description: 'Company name if B2B' }),
    __metadata("design:type", String)
], Customer.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'VIP customer, always pays on time', description: 'Internal notes about customer' }),
    __metadata("design:type", String)
], Customer.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'active', description: 'Customer status' }),
    __metadata("design:type", String)
], Customer.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['vip', 'recurring'], description: 'Customer tags' }),
    __metadata("design:type", Array)
], Customer.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15, description: 'Total number of leads' }),
    __metadata("design:type", Number)
], Customer.prototype, "totalLeads", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: 'Total number of bookings' }),
    __metadata("design:type", Number)
], Customer.prototype, "totalBookings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 18500.50, description: 'Total revenue from customer' }),
    __metadata("design:type", Number)
], Customer.prototype, "totalRevenue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last contact timestamp' }),
    __metadata("design:type", Date)
], Customer.prototype, "lastContactAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created timestamp' }),
    __metadata("design:type", Date)
], Customer.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated timestamp' }),
    __metadata("design:type", Date)
], Customer.prototype, "updatedAt", void 0);
//# sourceMappingURL=customer.entity.js.map