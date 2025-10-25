import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QualityChecklist, ChecklistItem } from './entities/quality-checklist.entity';
import { CreateQualityChecklistDto } from './dto';

@Injectable()
export class QualityChecklistsService {
  private readonly logger = new Logger(QualityChecklistsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateQualityChecklistDto): Promise<QualityChecklist> {
    this.logger.log(`Creating quality checklist for service type: ${createDto.service_type}`);

    // Check if active checklist already exists for this service type
    const existing = await this.prisma.renosQualityChecklist.findFirst({
      where: {
        serviceType: createDto.service_type,
        isActive: true,
      },
    });

    if (existing) {
      throw new BadRequestException(`Active checklist already exists for service type: ${createDto.service_type}`);
    }

    const checklist = await this.prisma.renosQualityChecklist.create({
      data: {
        serviceType: createDto.service_type,
        name: createDto.name,
        description: createDto.description,
        items: createDto.items as any,
        isActive: true,
        version: 1,
      },
    });

    return checklist as any;
  }

  async findAll(filters?: { serviceType?: string; isActive?: boolean }): Promise<QualityChecklist[]> {
    const checklists = await this.prisma.renosQualityChecklist.findMany({
      where: {
        serviceType: filters?.serviceType,
        isActive: filters?.isActive,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return checklists as any[];
  }

  async findById(id: string): Promise<QualityChecklist> {
    const checklist = await this.prisma.renosQualityChecklist.findUnique({
      where: { id },
    });

    if (!checklist) {
      throw new NotFoundException(`Checklist with ID ${id} not found`);
    }

    return checklist as any;
  }

  async getByServiceType(serviceType: string): Promise<QualityChecklist | null> {
    const checklist = await this.prisma.renosQualityChecklist.findFirst({
      where: {
        serviceType,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return checklist as any;
  }

  async createNewVersion(checklistId: string, updates: Partial<CreateQualityChecklistDto>): Promise<QualityChecklist> {
    this.logger.log(`Creating new version for checklist: ${checklistId}`);

    // Get current checklist
    const currentChecklist = await this.findById(checklistId);

    // Deactivate current version and create new version in transaction
    const newChecklist = await this.prisma.$transaction(async (prisma) => {
      // Deactivate current
      await prisma.renosQualityChecklist.update({
        where: { id: checklistId },
        data: { isActive: false },
      });

      // Create new version
      return prisma.renosQualityChecklist.create({
        data: {
          serviceType: currentChecklist.service_type,
          name: updates.name || currentChecklist.name,
          description: updates.description !== undefined ? updates.description : currentChecklist.description,
          items: (updates.items || currentChecklist.items) as any,
          isActive: true,
          version: currentChecklist.version + 1,
        },
      });
    });

    this.logger.log(`Created new version ${newChecklist.version} for service type: ${newChecklist.serviceType}`);
    return newChecklist as any;
  }

  async duplicateChecklist(checklistId: string, newServiceType: string, newName: string): Promise<QualityChecklist> {
    this.logger.log(`Duplicating checklist ${checklistId} for service type: ${newServiceType}`);

    const sourceChecklist = await this.findById(checklistId);

    const duplicate = await this.prisma.renosQualityChecklist.create({
      data: {
        serviceType: newServiceType,
        name: newName,
        description: sourceChecklist.description,
        items: sourceChecklist.items as any,
        isActive: true,
        version: 1,
      },
    });

    return duplicate as any;
  }

  async getChecklistVersions(serviceType: string): Promise<QualityChecklist[]> {
    const versions = await this.prisma.renosQualityChecklist.findMany({
      where: { serviceType },
      orderBy: {
        version: 'desc',
      },
    });

    return versions as any[];
  }

  async initializeDefaultChecklists(): Promise<QualityChecklist[]> {
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

    const created: QualityChecklist[] = [];

    for (const checklistData of defaultChecklists) {
      try {
        const existing = await this.getByServiceType(checklistData.service_type);
        if (!existing) {
          const checklist = await this.create(checklistData as CreateQualityChecklistDto);
          created.push(checklist);
        }
      } catch (error) {
        this.logger.warn(`Failed to create default checklist for ${checklistData.service_type}: ${error.message}`);
      }
    }

    this.logger.log(`Initialized ${created.length} default checklists`);
    return created;
  }

  async getChecklistAnalytics(): Promise<any> {
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
}
