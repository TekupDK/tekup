import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { JobsService } from "./jobs.service";
import { PrismaService } from "../database/prisma.service";
import { SupabaseService } from "../supabase/supabase.service";
import { JobStatus, ServiceType } from "./entities/job.entity";
import { CreateJobDto, UpdateJobStatusDto, AssignJobDto, JobFiltersDto } from "./dto";

describe("JobsService", () => {
  let service: JobsService;
  let prismaService: PrismaService;
  let supabaseService: SupabaseService;

  const mockOrganizationId = "org-123";
  const mockJobId = "job-123";
  const mockCustomerId = "customer-123";
  const mockTeamMemberId = "team-123";

  const mockJob = {
    id: mockJobId,
    organization_id: mockOrganizationId,
    customer_id: mockCustomerId,
    job_number: "JOB-2024-001",
    service_type: ServiceType.STANDARD,
    status: JobStatus.SCHEDULED,
    scheduled_date: "2024-12-01T10:00:00Z",
    estimated_duration: 120,
    actual_duration: null,
    location: {
      street: "Test Street 123",
      city: "Copenhagen",
      postal_code: "1000",
      country: "Denmark",
    },
    special_instructions: "Ring doorbell",
    checklist: [],
    photos: [],
    customer_signature: null,
    quality_score: null,
    profitability: null,
    recurring_job_id: null,
    parent_job_id: null,
    invoice_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSupabaseResponse = (data: any = null, error: any = null) => ({
    data,
    error,
    count: data ? (Array.isArray(data) ? data.length : 1) : 0,
  });

  const mockSupabaseQuery = () => {
    const query = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    return query;
  };

  beforeEach(async () => {
    const mockSupabaseClient = mockSupabaseQuery();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: {
            jobs: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            client: mockSupabaseClient,
          },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prismaService = module.get<PrismaService>(PrismaService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    // Add supabaseService to service instance (workaround for missing injection)
    (service as any).supabaseService = supabaseService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const createJobDto: CreateJobDto = {
      customer_id: mockCustomerId,
      service_type: ServiceType.STANDARD,
      scheduled_date: "2024-12-01T10:00:00Z",
      estimated_duration: 120,
      location: {
        street: "Test Street 123",
        city: "Copenhagen",
        postal_code: "1000",
        country: "Denmark",
      },
      special_instructions: "Ring doorbell",
    };

    it("should create a new job successfully", async () => {
      // Mock customer validation
      const mockClient = supabaseService.client as any;
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ id: mockCustomerId })
      );

      // Mock scheduling conflict check
      mockClient.single.mockResolvedValueOnce(mockSupabaseResponse(null));

      // Mock job creation
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockJob)
      );

      const result = await service.create(createJobDto, mockOrganizationId);

      expect(result).toEqual(mockJob);
      expect(mockClient.from).toHaveBeenCalledWith("customers");
      expect(mockClient.from).toHaveBeenCalledWith("jobs");
    });

    it("should throw NotFoundException if customer does not exist", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Not found" })
      );

      await expect(
        service.create(createJobDto, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if scheduling conflict exists", async () => {
      const mockClient = supabaseService.client as any;

      // Mock customer validation (success)
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ id: mockCustomerId })
      );

      // Mock conflict check (return existing job)
      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse([{ id: "conflict-job-123" }])
      );

      await expect(
        service.create(createJobDto, mockOrganizationId)
      ).rejects.toThrow(ConflictException);
    });

    it("should throw BadRequestException on database error", async () => {
      const mockClient = supabaseService.client as any;

      // Mock customer validation (success)
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ id: mockCustomerId })
      );

      // Mock scheduling conflict check (success)
      mockClient.mockResolvedValueOnce(mockSupabaseResponse([]));

      // Mock job creation (error)
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Database error" })
      );

      await expect(
        service.create(createJobDto, mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateStatus", () => {
    const updateStatusDto: UpdateJobStatusDto = {
      status: JobStatus.IN_PROGRESS,
      actual_duration: 130,
      quality_score: 4,
    };

    it("should update job status successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock findById
      jest.spyOn(service, "findById").mockResolvedValueOnce(mockJob as any);

      // Mock update
      const updatedJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(updatedJob)
      );

      const result = await service.updateStatus(
        mockJobId,
        updateStatusDto,
        mockOrganizationId
      );

      expect(result.status).toBe(JobStatus.IN_PROGRESS);
      expect(mockClient.update).toHaveBeenCalled();
    });

    it("should throw BadRequestException for invalid status transition", async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      jest.spyOn(service, "findById").mockResolvedValueOnce(completedJob as any);

      const invalidUpdate = { status: JobStatus.SCHEDULED };

      await expect(
        service.updateStatus(mockJobId, invalidUpdate, mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if job does not exist", async () => {
      jest.spyOn(service, "findById").mockRejectedValueOnce(
        new NotFoundException("Job not found")
      );

      await expect(
        service.updateStatus(mockJobId, updateStatusDto, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("assignTeamMembers", () => {
    const assignJobDto: AssignJobDto = {
      assignments: [
        {
          team_member_id: mockTeamMemberId,
          role: "lead",
        },
      ],
    };

    it("should assign team members successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock findById (job exists)
      jest.spyOn(service, "findById").mockResolvedValueOnce(mockJob as any);

      // Mock team member validation
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ id: mockTeamMemberId })
      );

      // Mock delete existing assignments
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      // Mock create new assignments
      const mockAssignment = {
        id: "assignment-123",
        job_id: mockJobId,
        team_member_id: mockTeamMemberId,
        role: "lead",
      };
      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse([mockAssignment])
      );

      const result = await service.assignTeamMembers(
        mockJobId,
        assignJobDto,
        mockOrganizationId
      );

      expect(result).toHaveLength(1);
      expect(result[0].team_member_id).toBe(mockTeamMemberId);
    });

    it("should throw NotFoundException if team member does not exist", async () => {
      const mockClient = supabaseService.client as any;

      // Mock findById (job exists)
      jest.spyOn(service, "findById").mockResolvedValueOnce(mockJob as any);

      // Mock team member validation (not found)
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Not found" })
      );

      await expect(
        service.assignTeamMembers(mockJobId, assignJobDto, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("rescheduleJob", () => {
    const newScheduledDate = "2024-12-15T10:00:00Z";

    it("should reschedule job successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock findById (original job)
      jest.spyOn(service, "findById").mockResolvedValueOnce(mockJob as any);

      // Mock create (new job)
      const rescheduledJob = {
        ...mockJob,
        id: "new-job-123",
        scheduled_date: newScheduledDate,
      };
      jest.spyOn(service, "create").mockResolvedValueOnce(rescheduledJob as any);

      // Mock update original job
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      const result = await service.rescheduleJob(
        mockJobId,
        newScheduledDate,
        mockOrganizationId
      );

      expect(result.scheduled_date).toBe(newScheduledDate);
      expect(service.create).toHaveBeenCalled();
    });

    it("should throw BadRequestException if job is completed", async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      jest.spyOn(service, "findById").mockResolvedValueOnce(completedJob as any);

      await expect(
        service.rescheduleJob(mockJobId, newScheduledDate, mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if job is cancelled", async () => {
      const cancelledJob = { ...mockJob, status: JobStatus.CANCELLED };
      jest.spyOn(service, "findById").mockResolvedValueOnce(cancelledJob as any);

      await expect(
        service.rescheduleJob(mockJobId, newScheduledDate, mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getJobProfitability", () => {
    it("should calculate profitability metrics correctly", async () => {
      const mockClient = supabaseService.client as any;

      const mockProfitabilityData = [
        {
          profitability: {
            total_price: 1200,
            labor_cost: 600,
            material_cost: 100,
            travel_cost: 50,
            profit_margin: 450,
          },
          service_type: ServiceType.STANDARD,
          scheduled_date: "2024-01-15T10:00:00Z",
        },
        {
          profitability: {
            total_price: 1800,
            labor_cost: 900,
            material_cost: 150,
            travel_cost: 50,
            profit_margin: 700,
          },
          service_type: ServiceType.DEEP,
          scheduled_date: "2024-01-20T10:00:00Z",
        },
      ];

      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(mockProfitabilityData)
      );

      const result = await service.getJobProfitability(mockOrganizationId);

      expect(result.total_revenue).toBe(3000);
      expect(result.total_costs).toBe(1850);
      expect(result.total_profit).toBe(1150);
      expect(result.profit_margin_percentage).toBeCloseTo(38.33, 1);
      expect(result.by_service_type[ServiceType.STANDARD]).toBeDefined();
      expect(result.by_service_type[ServiceType.DEEP]).toBeDefined();
      expect(result.monthly_trends["2024-01"]).toBeDefined();
    });

    it("should handle empty profitability data", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(mockSupabaseResponse([]));

      const result = await service.getJobProfitability(mockOrganizationId);

      expect(result.total_revenue).toBe(0);
      expect(result.total_profit).toBe(0);
      expect(result.profit_margin_percentage).toBe(0);
    });

    it("should throw BadRequestException on database error", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Database error" })
      );

      await expect(
        service.getJobProfitability(mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getJobAssignments", () => {
    it("should get job assignments successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock findById (job exists)
      jest.spyOn(service, "findById").mockResolvedValueOnce(mockJob as any);

      // Mock get assignments
      const mockAssignments = [
        {
          id: "assignment-123",
          job_id: mockJobId,
          team_member_id: mockTeamMemberId,
          role: "lead",
          team_members: {
            id: mockTeamMemberId,
            employee_id: "EMP-001",
            users: {
              id: "user-123",
              name: "John Doe",
              email: "john@example.com",
            },
          },
        },
      ];

      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(mockAssignments)
      );

      const result = await service.getJobAssignments(
        mockJobId,
        mockOrganizationId
      );

      expect(result).toHaveLength(1);
      expect(result[0].team_member_id).toBe(mockTeamMemberId);
    });

    it("should return empty array if no assignments", async () => {
      const mockClient = supabaseService.client as any;

      // Mock findById (job exists)
      jest.spyOn(service, "findById").mockResolvedValueOnce(mockJob as any);

      // Mock get assignments (empty)
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      const result = await service.getJobAssignments(
        mockJobId,
        mockOrganizationId
      );

      expect(result).toEqual([]);
    });
  });

  describe("findById (inherited from BaseService)", () => {
    it("should find job by id", async () => {
      jest.spyOn(prismaService.jobs, "findFirst").mockResolvedValue(mockJob as any);

      const result = await service.findById(mockJobId, mockOrganizationId);

      expect(result).toEqual(mockJob);
      expect(prismaService.jobs.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockJobId,
          organization_id: mockOrganizationId,
        },
      });
    });

    it("should throw NotFoundException if job not found", async () => {
      jest.spyOn(prismaService.jobs, "findFirst").mockResolvedValue(null);

      await expect(
        service.findById(mockJobId, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Status Transition Validation", () => {
    it("should allow SCHEDULED -> CONFIRMED transition", async () => {
      const mockClient = supabaseService.client as any;
      const scheduledJob = { ...mockJob, status: JobStatus.SCHEDULED };

      jest.spyOn(service, "findById").mockResolvedValueOnce(scheduledJob as any);

      const updatedJob = { ...scheduledJob, status: JobStatus.CONFIRMED };
      mockClient.single.mockResolvedValueOnce(mockSupabaseResponse(updatedJob));

      const result = await service.updateStatus(
        mockJobId,
        { status: JobStatus.CONFIRMED },
        mockOrganizationId
      );

      expect(result.status).toBe(JobStatus.CONFIRMED);
    });

    it("should allow CONFIRMED -> IN_PROGRESS transition", async () => {
      const mockClient = supabaseService.client as any;
      const confirmedJob = { ...mockJob, status: JobStatus.CONFIRMED };

      jest.spyOn(service, "findById").mockResolvedValueOnce(confirmedJob as any);

      const updatedJob = { ...confirmedJob, status: JobStatus.IN_PROGRESS };
      mockClient.single.mockResolvedValueOnce(mockSupabaseResponse(updatedJob));

      const result = await service.updateStatus(
        mockJobId,
        { status: JobStatus.IN_PROGRESS },
        mockOrganizationId
      );

      expect(result.status).toBe(JobStatus.IN_PROGRESS);
    });

    it("should allow IN_PROGRESS -> COMPLETED transition", async () => {
      const mockClient = supabaseService.client as any;
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS };

      jest.spyOn(service, "findById").mockResolvedValueOnce(inProgressJob as any);

      const updatedJob = { ...inProgressJob, status: JobStatus.COMPLETED };
      mockClient.single.mockResolvedValueOnce(mockSupabaseResponse(updatedJob));

      const result = await service.updateStatus(
        mockJobId,
        { status: JobStatus.COMPLETED },
        mockOrganizationId
      );

      expect(result.status).toBe(JobStatus.COMPLETED);
    });

    it("should reject invalid transition COMPLETED -> SCHEDULED", async () => {
      const completedJob = { ...mockJob, status: JobStatus.COMPLETED };
      jest.spyOn(service, "findById").mockResolvedValueOnce(completedJob as any);

      await expect(
        service.updateStatus(
          mockJobId,
          { status: JobStatus.SCHEDULED },
          mockOrganizationId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject invalid transition CANCELLED -> IN_PROGRESS", async () => {
      const cancelledJob = { ...mockJob, status: JobStatus.CANCELLED };
      jest.spyOn(service, "findById").mockResolvedValueOnce(cancelledJob as any);

      await expect(
        service.updateStatus(
          mockJobId,
          { status: JobStatus.IN_PROGRESS },
          mockOrganizationId
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
