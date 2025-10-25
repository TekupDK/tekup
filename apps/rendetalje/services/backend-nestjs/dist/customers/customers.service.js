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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let CustomersService = class CustomersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const { status, tag, minLeads, minBookings, minRevenue, search, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (tag)
            where.tags = { has: tag };
        if (minLeads !== undefined)
            where.totalLeads = { gte: minLeads };
        if (minBookings !== undefined)
            where.totalBookings = { gte: minBookings };
        if (minRevenue !== undefined)
            where.totalRevenue = { gte: minRevenue };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.renosCustomer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.renosCustomer.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return { data, total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
    }
    async findOne(id) {
        const customer = await this.prisma.renosCustomer.findUnique({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        return customer;
    }
    async create(data) {
        return this.prisma.renosCustomer.create({
            data: { ...data, tags: data.tags || [], status: 'active' },
        });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.renosCustomer.update({ where: { id }, data });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.renosCustomer.delete({ where: { id } });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map