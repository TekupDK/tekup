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
exports.BaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const pagination_util_1 = require("../utils/pagination.util");
let BaseService = class BaseService {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async findAll(organizationId, pagination, filters) {
        const { page = 1, limit = 10, search } = pagination;
        const skip = (page - 1) * limit;
        const where = {
            organization_id: organizationId,
            ...filters,
        };
        if (search && this.searchFields.length > 0) {
            where.OR = this.searchFields.map(field => ({
                [field]: {
                    contains: search,
                    mode: 'insensitive',
                },
            }));
        }
        const model = this.getModel();
        const [data, total] = await Promise.all([
            model.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            model.count({ where }),
        ]);
        return pagination_util_1.PaginationUtil.createPaginatedResponse(data, total, pagination);
    }
    async findById(id, organizationId) {
        const model = this.getModel();
        const data = await model.findFirst({
            where: {
                id,
                organization_id: organizationId,
            },
        });
        if (!data) {
            throw new common_1.NotFoundException(`${this.modelName} with ID ${id} not found`);
        }
        return data;
    }
    async create(createDto, organizationId) {
        const model = this.getModel();
        try {
            const data = await model.create({
                data: {
                    ...createDto,
                    organization_id: organizationId,
                },
            });
            return data;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create ${this.modelName}: ${error.message}`);
        }
    }
    async update(id, updateDto, organizationId) {
        await this.findById(id, organizationId);
        const model = this.getModel();
        try {
            const data = await model.update({
                where: {
                    id,
                    organization_id: organizationId,
                },
                data: updateDto,
            });
            return data;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to update ${this.modelName}: ${error.message}`);
        }
    }
    async delete(id, organizationId) {
        await this.findById(id, organizationId);
        const model = this.getModel();
        try {
            await model.delete({
                where: {
                    id,
                    organization_id: organizationId,
                },
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to delete ${this.modelName}: ${error.message}`);
        }
    }
    async count(organizationId, filters) {
        const model = this.getModel();
        return model.count({
            where: {
                organization_id: organizationId,
                ...filters,
            },
        });
    }
    getModel() {
        const modelMap = {
            customers: this.prismaService.customers,
            jobs: this.prismaService.jobs,
            job_assignments: this.prismaService.jobAssignments,
            team_members: this.prismaService.teamMembers,
            users: this.prismaService.users,
            organizations: this.prismaService.organizations,
            customer_messages: this.prismaService.customerMessages,
            customer_reviews: this.prismaService.customerReviews,
            time_entries: this.prismaService.timeEntries,
            chat_sessions: this.prismaService.chatSessions,
            chat_messages: this.prismaService.chatMessages,
        };
        const model = modelMap[this.modelName];
        if (!model) {
            throw new Error(`Model ${this.modelName} not found in Prisma client`);
        }
        return model;
    }
};
exports.BaseService = BaseService;
exports.BaseService = BaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BaseService);
//# sourceMappingURL=base.service.js.map