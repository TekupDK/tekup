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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const lead_entity_1 = require("./entities/lead.entity");
let LeadsService = class LeadsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const { status, priority, source, minEstimatedValue, minScore, email, phone, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
        const where = {};
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (source)
            where.source = source;
        if (email)
            where.email = email;
        if (phone)
            where.phone = phone;
        if (minEstimatedValue !== undefined) {
            where.estimatedValue = { gte: minEstimatedValue };
        }
        if (minScore !== undefined) {
            where.score = { gte: minScore };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        const total = await this.prisma.renosLead.count({ where });
        const skip = (page - 1) * limit;
        const leads = await this.prisma.renosLead.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: leads,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    async findOne(id) {
        const lead = await this.prisma.renosLead.findUnique({
            where: { id },
        });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead with ID ${id} not found`);
        }
        return lead;
    }
    async create(data) {
        const lead = await this.prisma.renosLead.create({
            data: {
                ...data,
                status: lead_entity_1.LeadStatus.NEW,
                score: 0,
                priority: lead_entity_1.LeadPriority.MEDIUM,
                followUpAttempts: 0,
                preferredDates: data.preferredDates || [],
            },
        });
        return lead;
    }
    async update(id, data) {
        await this.findOne(id);
        const lead = await this.prisma.renosLead.update({
            where: { id },
            data,
        });
        return lead;
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.renosLead.delete({
            where: { id },
        });
    }
    async enrichLead(id, enrichmentData) {
        const lead = await this.prisma.renosLead.update({
            where: { id },
            data: {
                ...enrichmentData,
                lastEnriched: new Date(),
            },
        });
        return lead;
    }
    async scoreLead(id, score, priority, metadata) {
        const lead = await this.prisma.renosLead.update({
            where: { id },
            data: {
                score,
                priority,
                lastScored: new Date(),
                scoreMetadata: metadata || undefined,
            },
        });
        return lead;
    }
    async incrementFollowUpAttempts(id) {
        const lead = await this.prisma.renosLead.update({
            where: { id },
            data: {
                followUpAttempts: { increment: 1 },
                lastFollowUpDate: new Date(),
            },
        });
        return lead;
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map