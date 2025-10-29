import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import {
  CreateSubcontractorDto,
  UpdateSubcontractorDto,
  CreateTaskAssignmentDto,
  UpdateTaskAssignmentDto,
  AssignTaskDto,
  CreateReviewDto,
} from "./dto";

@Injectable()
export class SubcontractorsService {
  private readonly logger = new Logger(SubcontractorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Helper to get typed prisma client
  private get db() {
    return this.prisma as any;
  }

  /**
   * Create a new subcontractor profile
   */
  async create(dto: CreateSubcontractorDto) {
    // Check for duplicate email
    const existing = await this.db.renosSubcontractor.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Subcontractor with email ${dto.email} already exists`
      );
    }

    return this.db.renosSubcontractor.create({
      data: {
        companyName: dto.companyName,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        cvrNumber: dto.cvrNumber,
        websiteUrl: dto.websiteUrl,
        status: dto.status || "active",
        notes: dto.notes,
        rating: 0, // Initial rating
      },
    });
  }

  /**
   * Get all subcontractors with optional filters
   */
  async findAll(filters?: {
    status?: string;
    minRating?: number;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.minRating) {
      where.rating = { gte: filters.minRating };
    }

    if (filters?.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.db.renosSubcontractor.findMany({
      where,
      orderBy: [{ rating: "desc" }, { companyName: "asc" }],
    });
  }

  /**
   * Get single subcontractor by ID
   */
  async findOne(id: string) {
    const subcontractor = await this.db.renosSubcontractor.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        documents: true,
        availability: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!subcontractor) {
      throw new NotFoundException(`Subcontractor with ID ${id} not found`);
    }

    return subcontractor;
  }

  /**
   * Update subcontractor profile
   */
  async update(id: string, dto: UpdateSubcontractorDto) {
    await this.findOne(id); // Verify exists

    if (dto.email) {
      // Check email uniqueness
      const existing = await this.db.renosSubcontractor.findFirst({
        where: {
          email: dto.email,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Email ${dto.email} is already in use`);
      }
    }

    return this.db.renosSubcontractor.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete subcontractor (soft delete by setting status to inactive)
   */
  async remove(id: string) {
    await this.findOne(id); // Verify exists

    return this.db.renosSubcontractor.update({
      where: { id },
      data: { status: "inactive" },
    });
  }

  /**
   * Assign a task to a subcontractor
   */
  async assignTask(dto: AssignTaskDto) {
    let subcontractorId = dto.subcontractorId;

    // If smart assignment requested and no specific subcontractor provided
    if (dto.useSmartAssignment && !subcontractorId) {
      subcontractorId = await this.findBestSubcontractor(dto.jobId);
    }

    if (!subcontractorId) {
      throw new ConflictException(
        "No suitable subcontractor found for this task"
      );
    }

    // Verify job exists
    const job = await this.db.renosJob.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${dto.jobId} not found`);
    }

    // Create assignment
    return this.db.renosTaskAssignment.create({
      data: {
        jobId: dto.jobId,
        subcontractorId,
        status: "assigned",
      },
      include: {
        subcontractor: true,
        job: true,
      },
    });
  }

  /**
   * Smart algorithm to find best subcontractor for a job
   * Considers: rating, availability, distance (if enabled), service capability
   */
  private async findBestSubcontractor(jobId: string): Promise<string | null> {
    this.logger.log(`Finding best subcontractor for job ${jobId}`);

    // Get job details
    const job = await this.db.renosJob.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Get all active subcontractors
    const subcontractors = await this.db.renosSubcontractor.findMany({
      where: { status: "active" },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        reviews: true,
      },
    });

    if (subcontractors.length === 0) {
      return null;
    }

    // Score each subcontractor
    const scored = subcontractors.map((sub) => {
      let score = 0;

      // Rating weight: 40%
      score += (sub.rating || 0) * 40;

      // Number of reviews (reliability indicator): 20%
      const reviewCount = sub.reviews.length;
      score += Math.min(reviewCount, 50) * 0.4; // Cap at 50 reviews for scoring

      // Service capability match: 20%
      // TODO: Match job service type with subcontractor services
      score += 20;

      // Availability: 20%
      // TODO: Check subcontractor_availability table
      score += 20;

      return { subcontractor: sub, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    this.logger.log(
      `Best subcontractor: ${scored[0].subcontractor.companyName} (score: ${scored[0].score})`
    );

    return scored[0].subcontractor.id;
  }

  /**
   * Get all task assignments (optionally filtered)
   */
  async getAssignments(filters?: {
    subcontractorId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters?.subcontractorId) {
      where.subcontractorId = filters.subcontractorId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.db.renosTaskAssignment.findMany({
      where,
      include: {
        subcontractor: true,
        job: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  }

  /**
   * Update assignment status
   */
  async updateAssignment(id: string, dto: UpdateTaskAssignmentDto) {
    const assignment = await this.db.renosTaskAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException(`Task assignment with ID ${id} not found`);
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;

      if (dto.status === "completed") {
        updateData.completedAt = new Date();
      }
    }

    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    return this.db.renosTaskAssignment.update({
      where: { id },
      data: updateData,
      include: {
        subcontractor: true,
        job: true,
      },
    });
  }

  /**
   * Create a review for a subcontractor
   */
  async createReview(subcontractorId: string, dto: CreateReviewDto) {
    // Verify subcontractor exists
    await this.findOne(subcontractorId);

    // Create review
    const review = await this.db.renosSubcontractorReview.create({
      data: {
        subcontractorId,
        rating: dto.rating,
        punctualityScore: dto.punctualityScore,
        qualityScore: dto.qualityScore,
        communicationScore: dto.communicationScore,
        comments: dto.comments,
      },
    });

    // Recalculate aggregate rating
    await this.updateAggregateRating(subcontractorId);

    return review;
  }

  /**
   * Recalculate aggregate rating for a subcontractor
   */
  private async updateAggregateRating(subcontractorId: string) {
    const reviews = await this.db.renosSubcontractorReview.findMany({
      where: { subcontractorId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return;
    }

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.db.renosSubcontractor.update({
      where: { id: subcontractorId },
      data: {
        rating: parseFloat(avgRating.toFixed(2)),
      },
    });

    this.logger.log(
      `Updated aggregate rating for subcontractor ${subcontractorId}: ${avgRating.toFixed(2)}`
    );
  }
}
