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
exports.QualityChecklistsService = void 0;
const common_1 = require("@nestjs/common");
const base_service_1 = require("../common/services/base.service");
const supabase_service_1 = require("../supabase/supabase.service");
const job_entity_1 = require("../jobs/entities/job.entity");
let QualityChecklistsService = class QualityChecklistsService extends base_service_1.BaseService {
    constructor(supabaseService) {
        super(supabaseService);
        this.supabaseService = supabaseService;
        this.tableName = 'quality_checklists';
        this.searchFields = ['name', 'description'];
    }
    async create(createDto, organizationId) {
        const { data: existing } = await this.supabaseService.client
            .from('quality_checklists')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('service_type', createDto.service_type)
            .eq('is_active', true)
            .single();
        if (existing) {
            throw new common_1.BadRequestException(`Active checklist already exists for service type: ${createDto.service_type}`);
        }
        const checklistData = {
            ...createDto,
            organization_id: organizationId,
            is_active: true,
            version: 1,
        };
        const { data, error } = await this.supabaseService.client
            .from('quality_checklists')
            .insert(checklistData)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create quality checklist: ${error.message}`);
        }
        return data;
    }
    async getByServiceType(serviceType, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('quality_checklists')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('service_type', serviceType)
            .eq('is_active', true)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new common_1.BadRequestException(`Failed to get checklist: ${error.message}`);
        }
        return data;
    }
    async createNewVersion(checklistId, organizationId, updates) {
        const currentChecklist = await this.findById(checklistId, organizationId);
        await this.supabaseService.client
            .from('quality_checklists')
            .update({ is_active: false })
            .eq('id', checklistId)
            .eq('organization_id', organizationId);
        const newVersionData = {
            ...currentChecklist,
            ...updates,
            id: undefined,
            version: currentChecklist.version + 1,
            is_active: true,
            created_at: undefined,
            updated_at: undefined,
        };
        const { data, error } = await this.supabaseService.client
            .from('quality_checklists')
            .insert(newVersionData)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to create new checklist version: ${error.message}`);
        }
        return data;
    }
    async getChecklistVersions(serviceType, organizationId) {
        const { data, error } = await this.supabaseService.client
            .from('quality_checklists')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('service_type', serviceType)
            .order('version', { ascending: false });
        if (error) {
            throw new common_1.BadRequestException(`Failed to get checklist versions: ${error.message}`);
        }
        return data || [];
    }
    async duplicateChecklist(checklistId, organizationId, newServiceType, newName) {
        const sourceChecklist = await this.findById(checklistId, organizationId);
        const duplicateData = {
            ...sourceChecklist,
            id: undefined,
            service_type: newServiceType,
            name: newName,
            version: 1,
            created_at: undefined,
            updated_at: undefined,
        };
        const { data, error } = await this.supabaseService.client
            .from('quality_checklists')
            .insert(duplicateData)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to duplicate checklist: ${error.message}`);
        }
        return data;
    }
    async validateChecklistItems(items) {
        const errors = [];
        const ids = items.map(item => item.id);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
            errors.push(`Duplicate item IDs found: ${duplicateIds.join(', ')}`);
        }
        items.forEach((item, index) => {
            if (!item.id) {
                errors.push(`Item at index ${index} is missing ID`);
            }
            if (!item.title) {
                errors.push(`Item at index ${index} is missing title`);
            }
            if (item.order < 1) {
                errors.push(`Item at index ${index} has invalid order (must be >= 1)`);
            }
        });
        const orders = items.map(item => item.order);
        const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);
        if (duplicateOrders.length > 0) {
            errors.push(`Duplicate order numbers found: ${duplicateOrders.join(', ')}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    async getChecklistAnalytics(organizationId) {
        const { data: assessments, error } = await this.supabaseService.client
            .from('job_quality_assessments')
            .select(`
        id,
        overall_score,
        percentage_score,
        quality_checklists!inner(service_type, name),
        jobs!inner(organization_id, service_type, status)
      `)
            .eq('jobs.organization_id', organizationId);
        if (error) {
            throw new common_1.BadRequestException(`Failed to get checklist analytics: ${error.message}`);
        }
        const analytics = {
            total_assessments: assessments?.length || 0,
            average_score: 0,
            score_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            by_service_type: {},
            completion_trends: {},
        };
        if (assessments && assessments.length > 0) {
            analytics.average_score = assessments.reduce((sum, a) => sum + a.overall_score, 0) / assessments.length;
            assessments.forEach(assessment => {
                analytics.score_distribution[assessment.overall_score]++;
            });
            assessments.forEach(assessment => {
                const serviceType = assessment.quality_checklists.service_type;
                if (!analytics.by_service_type[serviceType]) {
                    analytics.by_service_type[serviceType] = {
                        count: 0,
                        average_score: 0,
                        total_score: 0,
                    };
                }
                analytics.by_service_type[serviceType].count++;
                analytics.by_service_type[serviceType].total_score += assessment.overall_score;
            });
            Object.keys(analytics.by_service_type).forEach(serviceType => {
                const data = analytics.by_service_type[serviceType];
                data.average_score = data.total_score / data.count;
            });
        }
        return analytics;
    }
    async initializeDefaultChecklists(organizationId) {
        const defaultChecklists = [
            {
                service_type: job_entity_1.ServiceType.STANDARD,
                name: 'Standard Rengøring Tjekliste',
                description: 'Grundig tjekliste for standard rengøringsopgaver',
                items: [
                    { id: 'vacuum_floors', title: 'Støvsug alle gulve', required: true, photo_required: false, order: 1, category: 'floors', points: 5 },
                    { id: 'mop_floors', title: 'Vask alle gulve', required: true, photo_required: false, order: 2, category: 'floors', points: 5 },
                    { id: 'clean_bathroom', title: 'Rengør badeværelse', required: true, photo_required: true, order: 3, category: 'bathroom', points: 8 },
                    { id: 'clean_kitchen', title: 'Rengør køkken', required: true, photo_required: true, order: 4, category: 'kitchen', points: 8 },
                    { id: 'dust_surfaces', title: 'Aftør alle overflader', required: true, photo_required: false, order: 5, category: 'surfaces', points: 6 },
                    { id: 'empty_trash', title: 'Tøm skraldespande', required: true, photo_required: false, order: 6, category: 'general', points: 3 },
                    { id: 'check_supplies', title: 'Tjek forsyninger', required: false, photo_required: false, order: 7, category: 'general', points: 2 },
                ],
            },
            {
                service_type: job_entity_1.ServiceType.DEEP,
                name: 'Hovedrengøring Tjekliste',
                description: 'Omfattende tjekliste for hovedrengøring',
                items: [
                    { id: 'vacuum_floors_deep', title: 'Støvsug alle gulve grundigt', required: true, photo_required: false, order: 1, category: 'floors', points: 6 },
                    { id: 'mop_floors_deep', title: 'Vask alle gulve grundigt', required: true, photo_required: true, order: 2, category: 'floors', points: 6 },
                    { id: 'clean_bathroom_deep', title: 'Dybderengør badeværelse', required: true, photo_required: true, order: 3, category: 'bathroom', points: 10 },
                    { id: 'clean_kitchen_deep', title: 'Dybderengør køkken', required: true, photo_required: true, order: 4, category: 'kitchen', points: 10 },
                    { id: 'clean_windows', title: 'Rengør vinduer', required: true, photo_required: true, order: 5, category: 'windows', points: 8 },
                    { id: 'clean_baseboards', title: 'Rengør fodpaneler', required: true, photo_required: false, order: 6, category: 'details', points: 5 },
                    { id: 'clean_light_fixtures', title: 'Rengør lamper', required: true, photo_required: false, order: 7, category: 'details', points: 4 },
                    { id: 'organize_spaces', title: 'Organiser rum', required: false, photo_required: false, order: 8, category: 'general', points: 3 },
                ],
            },
            {
                service_type: job_entity_1.ServiceType.WINDOW,
                name: 'Vinduespolering Tjekliste',
                description: 'Specialiseret tjekliste for vinduesrengøring',
                items: [
                    { id: 'clean_exterior_windows', title: 'Rengør vinduer udefra', required: true, photo_required: true, order: 1, category: 'exterior', points: 10 },
                    { id: 'clean_interior_windows', title: 'Rengør vinduer indefra', required: true, photo_required: true, order: 2, category: 'interior', points: 10 },
                    { id: 'clean_window_frames', title: 'Rengør vinduesrammer', required: true, photo_required: false, order: 3, category: 'frames', points: 6 },
                    { id: 'clean_window_sills', title: 'Rengør vindueskarme', required: true, photo_required: false, order: 4, category: 'frames', points: 4 },
                    { id: 'check_window_condition', title: 'Tjek vinduestilstand', required: false, photo_required: true, order: 5, category: 'inspection', points: 2 },
                ],
            },
        ];
        const createdChecklists = [];
        for (const checklistData of defaultChecklists) {
            try {
                const checklist = await this.create(checklistData, organizationId);
                createdChecklists.push(checklist);
            }
            catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
            }
        }
        return createdChecklists;
    }
};
exports.QualityChecklistsService = QualityChecklistsService;
exports.QualityChecklistsService = QualityChecklistsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], QualityChecklistsService);
//# sourceMappingURL=quality-checklists.service.js.map