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
var QualityChecklistsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityChecklistsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let QualityChecklistsService = QualityChecklistsService_1 = class QualityChecklistsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(QualityChecklistsService_1.name);
    }
    async create(createDto) {
        this.logger.log(`Creating quality checklist for service type: ${createDto.service_type}`);
        const existing = await this.prisma.renosQualityChecklist.findFirst({
            where: {
                serviceType: createDto.service_type,
                isActive: true,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Active checklist already exists for service type: ${createDto.service_type}`);
        }
        const checklist = await this.prisma.renosQualityChecklist.create({
            data: {
                serviceType: createDto.service_type,
                name: createDto.name,
                description: createDto.description,
                items: createDto.items,
                isActive: true,
                version: 1,
            },
        });
        return checklist;
    }
    async findAll(filters) {
        const checklists = await this.prisma.renosQualityChecklist.findMany({
            where: {
                serviceType: filters?.serviceType,
                isActive: filters?.isActive,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return checklists;
    }
    async findById(id) {
        const checklist = await this.prisma.renosQualityChecklist.findUnique({
            where: { id },
        });
        if (!checklist) {
            throw new common_1.NotFoundException(`Checklist with ID ${id} not found`);
        }
        return checklist;
    }
    async getByServiceType(serviceType) {
        const checklist = await this.prisma.renosQualityChecklist.findFirst({
            where: {
                serviceType,
                isActive: true,
            },
            orderBy: {
                version: 'desc',
            },
        });
        return checklist;
    }
    async createNewVersion(checklistId, updates) {
        this.logger.log(`Creating new version for checklist: ${checklistId}`);
        const currentChecklist = await this.findById(checklistId);
        const newChecklist = await this.prisma.$transaction(async (prisma) => {
            await prisma.renosQualityChecklist.update({
                where: { id: checklistId },
                data: { isActive: false },
            });
            return prisma.renosQualityChecklist.create({
                data: {
                    serviceType: currentChecklist.service_type,
                    name: updates.name || currentChecklist.name,
                    description: updates.description !== undefined ? updates.description : currentChecklist.description,
                    items: (updates.items || currentChecklist.items),
                    isActive: true,
                    version: currentChecklist.version + 1,
                },
            });
        });
        this.logger.log(`Created new version ${newChecklist.version} for service type: ${newChecklist.serviceType}`);
        return newChecklist;
    }
    async duplicateChecklist(checklistId, newServiceType, newName) {
        this.logger.log(`Duplicating checklist ${checklistId} for service type: ${newServiceType}`);
        const sourceChecklist = await this.findById(checklistId);
        const duplicate = await this.prisma.renosQualityChecklist.create({
            data: {
                serviceType: newServiceType,
                name: newName,
                description: sourceChecklist.description,
                items: sourceChecklist.items,
                isActive: true,
                version: 1,
            },
        });
        return duplicate;
    }
    async getChecklistVersions(serviceType) {
        const versions = await this.prisma.renosQualityChecklist.findMany({
            where: { serviceType },
            orderBy: {
                version: 'desc',
            },
        });
        return versions;
    }
    async initializeDefaultChecklists() {
        this.logger.log('Initializing default checklists for all service types');
        const defaultChecklists = [
            {
                service_type: 'standard',
                name: 'Standard Cleaning Checklist',
                description: 'Comprehensive checklist for standard cleaning services',
                items: [
                    { id: 'vacuum_floors', title: 'Støvsug alle gulve', description: 'Støvsug alle gulvtyper grundigt', required: true, photo_required: false, order: 1, category: 'floors', points: 5 },
                    { id: 'mop_floors', title: 'Vask gulve', description: 'Vask alle hårde gulve', required: true, photo_required: false, order: 2, category: 'floors', points: 5 },
                    { id: 'dust_surfaces', title: 'Støvaftør overflader', description: 'Støvaftør alle overflader', required: true, photo_required: false, order: 3, category: 'surfaces', points: 5 },
                    { id: 'clean_kitchen', title: 'Rengør køkken', description: 'Rengør køkkenbord, komfur, og vask', required: true, photo_required: true, order: 4, category: 'kitchen', points: 10 },
                    { id: 'clean_bathroom', title: 'Rengør badeværelse', description: 'Rengør toilet, vask, og brusekabine', required: true, photo_required: true, order: 5, category: 'bathroom', points: 10 },
                ],
            },
            {
                service_type: 'deep',
                name: 'Deep Cleaning Checklist',
                description: 'Detailed checklist for deep cleaning services',
                items: [
                    { id: 'clean_windows', title: 'Pudse vinduer', description: 'Pudse alle vinduer indvendigt', required: true, photo_required: true, order: 1, category: 'windows', points: 10 },
                    { id: 'clean_oven', title: 'Rengør ovn', description: 'Grundig rengøring af ovn og bageplader', required: true, photo_required: true, order: 2, category: 'kitchen', points: 10 },
                    { id: 'clean_cabinets', title: 'Rengør skabe', description: 'Rengør skabe indvendigt og udvendigt', required: true, photo_required: false, order: 3, category: 'storage', points: 8 },
                ],
            },
            {
                service_type: 'move_in_out',
                name: 'Move In/Out Cleaning Checklist',
                description: 'Complete checklist for move in/out cleaning',
                items: [
                    { id: 'check_walls', title: 'Tjek vægge', description: 'Inspicer og rengør vægge', required: true, photo_required: true, order: 1, category: 'walls', points: 8 },
                    { id: 'clean_appliances', title: 'Rengør hårde hvidevarer', description: 'Grundig rengøring af alle hårde hvidevarer', required: true, photo_required: true, order: 2, category: 'appliances', points: 10 },
                ],
            },
        ];
        const created = [];
        for (const checklistData of defaultChecklists) {
            try {
                const existing = await this.getByServiceType(checklistData.service_type);
                if (!existing) {
                    const checklist = await this.create(checklistData);
                    created.push(checklist);
                }
            }
            catch (error) {
                this.logger.warn(`Failed to create default checklist for ${checklistData.service_type}: ${error.message}`);
            }
        }
        this.logger.log(`Initialized ${created.length} default checklists`);
        return created;
    }
    async getChecklistAnalytics() {
        this.logger.log('Generating checklist analytics');
        const checklists = await this.prisma.renosQualityChecklist.findMany({
            include: {
                assessments: true,
            },
        });
        const analytics = checklists.map((checklist) => ({
            id: checklist.id,
            name: checklist.name,
            serviceType: checklist.serviceType,
            version: checklist.version,
            isActive: checklist.isActive,
            usageCount: checklist.assessments.length,
            averageScore: checklist.assessments.length > 0
                ? checklist.assessments.reduce((sum, a) => sum + a.overallScore, 0) / checklist.assessments.length
                : 0,
        }));
        return {
            totalChecklists: checklists.length,
            activeChecklists: checklists.filter((c) => c.isActive).length,
            checklists: analytics,
        };
    }
};
exports.QualityChecklistsService = QualityChecklistsService;
exports.QualityChecklistsService = QualityChecklistsService = QualityChecklistsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QualityChecklistsService);
//# sourceMappingURL=quality-checklists.service.js.map