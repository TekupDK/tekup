import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { BaseService } from "../common/services/base.service";
import { SupabaseService } from "../supabase/supabase.service";
import {
  QualityChecklist,
  ChecklistItem,
} from "./entities/quality-checklist.entity";
import { CreateQualityChecklistDto } from "./dto";
import { ServiceType } from "../jobs/entities/job.entity";

@Injectable()
export class QualityChecklistsService extends BaseService<QualityChecklist> {
  protected tableName = "quality_checklists";
  protected searchFields = ["name", "description"];

  
  protected readonly modelName = 'quality_checklists';

  constructor(protected readonly supabaseService: SupabaseService) {
    super(supabaseService);
  }

  async create(
    createDto: CreateQualityChecklistDto,
    organizationId: string
  ): Promise<QualityChecklist> {
    // Check if checklist already exists for this service type
    const { data: existing } = await this.supabaseService.client
      .from("quality_checklists")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("service_type", createDto.service_type)
      .eq("is_active", true)
      .single();

    if (existing) {
      throw new BadRequestException(
        `Active checklist already exists for service type: ${createDto.service_type}`
      );
    }

    const checklistData = {
      ...createDto,
      organization_id: organizationId,
      is_active: true,
      version: 1,
    };

    const { data, error } = await this.supabaseService.client
      .from("quality_checklists")
      .insert(checklistData)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create quality checklist: ${error.message}`
      );
    }

    return data;
  }

  async getByServiceType(
    serviceType: ServiceType,
    organizationId: string
  ): Promise<QualityChecklist | null> {
    const { data, error } = await this.supabaseService.client
      .from("quality_checklists")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("service_type", serviceType)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new BadRequestException(
        `Failed to get checklist: ${error.message}`
      );
    }

    return data;
  }

  async createNewVersion(
    checklistId: string,
    organizationId: string,
    updates: Partial<QualityChecklist>
  ): Promise<QualityChecklist> {
    // Get current checklist
    const currentChecklist = await this.findById(checklistId, organizationId);

    // Deactivate current version
    await this.supabaseService.client
      .from("quality_checklists")
      .update({ is_active: false })
      .eq("id", checklistId)
      .eq("organization_id", organizationId);

    // Create new version
    const newVersionData = {
      ...currentChecklist,
      ...updates,
      id: undefined, // Let database generate new ID
      version: currentChecklist.version + 1,
      is_active: true,
      created_at: undefined,
      updated_at: undefined,
    };

    const { data, error } = await this.supabaseService.client
      .from("quality_checklists")
      .insert(newVersionData)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to create new checklist version: ${error.message}`
      );
    }

    return data;
  }

  async getChecklistVersions(
    serviceType: ServiceType,
    organizationId: string
  ): Promise<QualityChecklist[]> {
    const { data, error } = await this.supabaseService.client
      .from("quality_checklists")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("service_type", serviceType)
      .order("version", { ascending: false });

    if (error) {
      throw new BadRequestException(
        `Failed to get checklist versions: ${error.message}`
      );
    }

    return data || [];
  }

  async duplicateChecklist(
    checklistId: string,
    organizationId: string,
    newServiceType: ServiceType,
    newName: string
  ): Promise<QualityChecklist> {
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
      .from("quality_checklists")
      .insert(duplicateData)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Failed to duplicate checklist: ${error.message}`
      );
    }

    return data;
  }

  async validateChecklistItems(
    items: ChecklistItem[]
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for duplicate IDs
    const ids = items.map((item) => item.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate item IDs found: ${duplicateIds.join(", ")}`);
    }

    // Check for missing required fields
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

    // Check for duplicate orders
    const orders = items.map((item) => item.order);
    const duplicateOrders = orders.filter(
      (order, index) => orders.indexOf(order) !== index
    );
    if (duplicateOrders.length > 0) {
      errors.push(
        `Duplicate order numbers found: ${duplicateOrders.join(", ")}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async getChecklistAnalytics(organizationId: string): Promise<any> {
    // Get checklist usage statistics
    const { data: assessments, error } = await this.supabaseService.client
      .from("job_quality_assessments")
      .select(
        `
        id,
        overall_score,
        percentage_score,
        quality_checklists!inner(service_type, name),
        jobs!inner(organization_id, service_type, status)
      `
      )
      .eq("jobs.organization_id", organizationId);

    if (error) {
      throw new BadRequestException(
        `Failed to get checklist analytics: ${error.message}`
      );
    }

    // Calculate analytics
    const analytics = {
      total_assessments: assessments?.length || 0,
      average_score: 0,
      score_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      by_service_type: {} as Record<string, any>,
      completion_trends: {} as Record<string, number>,
    };

    if (assessments && assessments.length > 0) {
      // Calculate average score
      analytics.average_score =
        assessments.reduce((sum, a) => sum + a.overall_score, 0) /
        assessments.length;

      // Score distribution
      assessments.forEach((assessment) => {
        analytics.score_distribution[
          assessment.overall_score as keyof typeof analytics.score_distribution
        ]++;
      });

      // By service type
      assessments.forEach((assessment) => {
        const serviceType = assessment.quality_checklists.service_type;
        if (!analytics.by_service_type[serviceType]) {
          analytics.by_service_type[serviceType] = {
            count: 0,
            average_score: 0,
            total_score: 0,
          };
        }
        analytics.by_service_type[serviceType].count++;
        analytics.by_service_type[serviceType].total_score +=
          assessment.overall_score;
      });

      // Calculate averages for service types
      Object.keys(analytics.by_service_type).forEach((serviceType) => {
        const data = analytics.by_service_type[serviceType];
        data.average_score = data.total_score / data.count;
      });
    }

    return analytics;
  }

  // Initialize default checklists for all service types
  async initializeDefaultChecklists(
    organizationId: string
  ): Promise<QualityChecklist[]> {
    const defaultChecklists = [
      {
        service_type: ServiceType.STANDARD,
        name: "Standard Rengøring Tjekliste",
        description: "Grundig tjekliste for standard rengøringsopgaver",
        items: [
          {
            id: "vacuum_floors",
            title: "Støvsug alle gulve",
            required: true,
            photo_required: false,
            order: 1,
            category: "floors",
            points: 5,
          },
          {
            id: "mop_floors",
            title: "Vask alle gulve",
            required: true,
            photo_required: false,
            order: 2,
            category: "floors",
            points: 5,
          },
          {
            id: "clean_bathroom",
            title: "Rengør badeværelse",
            required: true,
            photo_required: true,
            order: 3,
            category: "bathroom",
            points: 8,
          },
          {
            id: "clean_kitchen",
            title: "Rengør køkken",
            required: true,
            photo_required: true,
            order: 4,
            category: "kitchen",
            points: 8,
          },
          {
            id: "dust_surfaces",
            title: "Aftør alle overflader",
            required: true,
            photo_required: false,
            order: 5,
            category: "surfaces",
            points: 6,
          },
          {
            id: "empty_trash",
            title: "Tøm skraldespande",
            required: true,
            photo_required: false,
            order: 6,
            category: "general",
            points: 3,
          },
          {
            id: "check_supplies",
            title: "Tjek forsyninger",
            required: false,
            photo_required: false,
            order: 7,
            category: "general",
            points: 2,
          },
        ],
      },
      {
        service_type: ServiceType.DEEP,
        name: "Hovedrengøring Tjekliste",
        description: "Omfattende tjekliste for hovedrengøring",
        items: [
          {
            id: "vacuum_floors_deep",
            title: "Støvsug alle gulve grundigt",
            required: true,
            photo_required: false,
            order: 1,
            category: "floors",
            points: 6,
          },
          {
            id: "mop_floors_deep",
            title: "Vask alle gulve grundigt",
            required: true,
            photo_required: true,
            order: 2,
            category: "floors",
            points: 6,
          },
          {
            id: "clean_bathroom_deep",
            title: "Dybderengør badeværelse",
            required: true,
            photo_required: true,
            order: 3,
            category: "bathroom",
            points: 10,
          },
          {
            id: "clean_kitchen_deep",
            title: "Dybderengør køkken",
            required: true,
            photo_required: true,
            order: 4,
            category: "kitchen",
            points: 10,
          },
          {
            id: "clean_windows",
            title: "Rengør vinduer",
            required: true,
            photo_required: true,
            order: 5,
            category: "windows",
            points: 8,
          },
          {
            id: "clean_baseboards",
            title: "Rengør fodpaneler",
            required: true,
            photo_required: false,
            order: 6,
            category: "details",
            points: 5,
          },
          {
            id: "clean_light_fixtures",
            title: "Rengør lamper",
            required: true,
            photo_required: false,
            order: 7,
            category: "details",
            points: 4,
          },
          {
            id: "organize_spaces",
            title: "Organiser rum",
            required: false,
            photo_required: false,
            order: 8,
            category: "general",
            points: 3,
          },
        ],
      },
      {
        service_type: ServiceType.WINDOW,
        name: "Vinduespolering Tjekliste",
        description: "Specialiseret tjekliste for vinduesrengøring",
        items: [
          {
            id: "clean_exterior_windows",
            title: "Rengør vinduer udefra",
            required: true,
            photo_required: true,
            order: 1,
            category: "exterior",
            points: 10,
          },
          {
            id: "clean_interior_windows",
            title: "Rengør vinduer indefra",
            required: true,
            photo_required: true,
            order: 2,
            category: "interior",
            points: 10,
          },
          {
            id: "clean_window_frames",
            title: "Rengør vinduesrammer",
            required: true,
            photo_required: false,
            order: 3,
            category: "frames",
            points: 6,
          },
          {
            id: "clean_window_sills",
            title: "Rengør vindueskarme",
            required: true,
            photo_required: false,
            order: 4,
            category: "frames",
            points: 4,
          },
          {
            id: "check_window_condition",
            title: "Tjek vinduestilstand",
            required: false,
            photo_required: true,
            order: 5,
            category: "inspection",
            points: 2,
          },
        ],
      },
    ];

    const createdChecklists: QualityChecklist[] = [];

    for (const checklistData of defaultChecklists) {
      try {
        const checklist = await this.create(
          checklistData as CreateQualityChecklistDto,
          organizationId
        );
        createdChecklists.push(checklist);
      } catch (error) {
        // Skip if already exists
        if (!error.message.includes("already exists")) {
          throw error;
        }
      }
    }

    return createdChecklists;
  }
}
