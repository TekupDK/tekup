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
exports.CustomerReview = void 0;
const swagger_1 = require("@nestjs/swagger");
const base_entity_1 = require("../../common/entities/base.entity");
class CustomerReview extends base_entity_1.BaseEntity {
}
exports.CustomerReview = CustomerReview;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000001', description: 'Job ID' }),
    __metadata("design:type", String)
], CustomerReview.prototype, "job_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000002', description: 'Customer ID' }),
    __metadata("design:type", String)
], CustomerReview.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'Rating (1-5 stars)', minimum: 1, maximum: 5 }),
    __metadata("design:type", Number)
], CustomerReview.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Fantastisk service! Meget tilfreds med rengøringen.', description: 'Review text' }),
    __metadata("design:type", String)
], CustomerReview.prototype, "review_text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Review photos',
        example: ['https://example.com/after1.jpg', 'https://example.com/after2.jpg']
    }),
    __metadata("design:type", Array)
], CustomerReview.prototype, "photos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether review is publicly visible' }),
    __metadata("design:type", Boolean)
], CustomerReview.prototype, "is_public", void 0);
//# sourceMappingURL=customer-review.entity.js.map