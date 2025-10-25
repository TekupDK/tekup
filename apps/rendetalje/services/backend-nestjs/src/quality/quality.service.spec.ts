import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { QualityService } from "./quality.service";
import { SupabaseService } from "../supabase/supabase.service";
import { JobsService } from "../jobs/jobs.service";
import { QualityChecklistsService } from "./quality-checklists.service";
import { PhotoDocumentationService } from "./photo-documentation.service";
import {
  JobQualityAssessment,
  CompletedChecklistItem,
} from "./entities/job-quality-assessment.entity";
import { CreateQualityAssessmentDto } from "./dto";

describe("QualityService", () => {
  let service: QualityService;
  let supabaseService: SupabaseService;
  let jobsService: JobsService;
  let qualityChecklistsService: QualityChecklistsService;
  let photoDocumentationService: PhotoDocumentationService;

  const mockOrganizationId = "org-123";
  const mockJobId = "job-123";
  const mockChecklistId = "checklist-123";
  const mockAssessmentId = "assessment-123";
  const mockAssessedBy = "user-123";

  const mockCompletedItems: CompletedChecklistItem[] = [
    {
      id: "item-1",
      completed: true,
      points_earned: 5,
      notes: "Completed well",
      photo_urls: [],
    },
    {
      id: "item-2",
      completed: true,
      points_earned: 4,
      notes: "",
      photo_urls: [],
    },
    {
      id: "item-3",
      completed: false,
      points_earned: 0,
      notes: "Issue with cleaning",
      photo_urls: [],
    },
  ];

  const mockAssessment: JobQualityAssessment = {
    id: mockAssessmentId,
    job_id: mockJobId,
    checklist_id: mockChecklistId,
    assessed_by: mockAssessedBy,
    overall_score: 4,
    percentage_score: 75,
    total_points_earned: 9,
    max_possible_points: 12,
    completed_items: mockCompletedItems,
    notes: "Good job overall",
    status: "completed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
      eq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    return query;
  };

  beforeEach(async () => {
    const mockSupabaseClient = mockSupabaseQuery();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityService,
        {
          provide: SupabaseService,
          useValue: {
            client: mockSupabaseClient,
          },
        },
        {
          provide: JobsService,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: QualityChecklistsService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: PhotoDocumentationService,
          useValue: {
            organizePhotosByDate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QualityService>(QualityService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    jobsService = module.get<JobsService>(JobsService);
    qualityChecklistsService = module.get<QualityChecklistsService>(
      QualityChecklistsService
    );
    photoDocumentationService = module.get<PhotoDocumentationService>(
      PhotoDocumentationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createAssessment", () => {
    const createDto: CreateQualityAssessmentDto = {
      job_id: mockJobId,
      checklist_id: mockChecklistId,
      overall_score: 4,
      completed_items: mockCompletedItems,
      notes: "Good job overall",
    };

    it("should create assessment successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock job validation
      jest.spyOn(jobsService, "findById").mockResolvedValueOnce({} as any);

      // Mock checklist validation
      jest.spyOn(qualityChecklistsService, "findById").mockResolvedValueOnce({} as any);

      // Mock insert
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockAssessment)
      );

      // Mock job update
      jest.spyOn(jobsService, "update").mockResolvedValueOnce({} as any);

      const result = await service.createAssessment(
        createDto,
        mockOrganizationId,
        mockAssessedBy
      );

      expect(result).toEqual(mockAssessment);
      expect(jobsService.findById).toHaveBeenCalledWith(
        mockJobId,
        mockOrganizationId
      );
      expect(qualityChecklistsService.findById).toHaveBeenCalledWith(
        mockChecklistId,
        mockOrganizationId
      );
      expect(jobsService.update).toHaveBeenCalledWith(
        mockJobId,
        { quality_score: createDto.overall_score },
        mockOrganizationId
      );
    });

    it("should calculate scores correctly", async () => {
      const mockClient = supabaseService.client as any;

      jest.spyOn(jobsService, "findById").mockResolvedValueOnce({} as any);
      jest.spyOn(qualityChecklistsService, "findById").mockResolvedValueOnce({} as any);
      jest.spyOn(jobsService, "update").mockResolvedValueOnce({} as any);

      let capturedAssessmentData: any;
      mockClient.insert.mockImplementation((data: any) => {
        capturedAssessmentData = data;
        return mockClient;
      });
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockAssessment)
      );

      await service.createAssessment(
        createDto,
        mockOrganizationId,
        mockAssessedBy
      );

      expect(capturedAssessmentData).toHaveProperty("percentage_score");
      expect(capturedAssessmentData).toHaveProperty("total_points_earned");
      expect(capturedAssessmentData).toHaveProperty("max_possible_points");
      expect(capturedAssessmentData.percentage_score).toBeGreaterThanOrEqual(0);
      expect(capturedAssessmentData.percentage_score).toBeLessThanOrEqual(100);
    });

    it("should throw NotFoundException if job not found", async () => {
      jest
        .spyOn(jobsService, "findById")
        .mockRejectedValueOnce(new NotFoundException("Job not found"));

      await expect(
        service.createAssessment(createDto, mockOrganizationId, mockAssessedBy)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if checklist not found", async () => {
      jest.spyOn(jobsService, "findById").mockResolvedValueOnce({} as any);
      jest
        .spyOn(qualityChecklistsService, "findById")
        .mockRejectedValueOnce(new NotFoundException("Checklist not found"));

      await expect(
        service.createAssessment(createDto, mockOrganizationId, mockAssessedBy)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on database error", async () => {
      const mockClient = supabaseService.client as any;

      jest.spyOn(jobsService, "findById").mockResolvedValueOnce({} as any);
      jest.spyOn(qualityChecklistsService, "findById").mockResolvedValueOnce({} as any);

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Database error" })
      );

      await expect(
        service.createAssessment(createDto, mockOrganizationId, mockAssessedBy)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getJobAssessment", () => {
    it("should get job assessment successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock job validation
      jest.spyOn(jobsService, "findById").mockResolvedValueOnce({} as any);

      // Mock assessment retrieval
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(mockAssessment)
      );

      const result = await service.getJobAssessment(
        mockJobId,
        mockOrganizationId
      );

      expect(result).toEqual(mockAssessment);
      expect(jobsService.findById).toHaveBeenCalledWith(
        mockJobId,
        mockOrganizationId
      );
    });

    it("should return null if no assessment found (PGRST116)", async () => {
      const mockClient = supabaseService.client as any;

      jest.spyOn(jobsService, "findById").mockResolvedValueOnce({} as any);

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { code: "PGRST116" })
      );

      const result = await service.getJobAssessment(
        mockJobId,
        mockOrganizationId
      );

      expect(result).toBeNull();
    });

    it("should throw BadRequestException for other errors", async () => {
      const mockClient = supabaseService.client as any;

      jest.spyOn(jobsService, "findById").mockResolvedValueOnce({} as any);

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, { message: "Database error", code: "ERROR" })
      );

      await expect(
        service.getJobAssessment(mockJobId, mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateAssessment", () => {
    const updates = {
      overall_score: 5,
      notes: "Updated notes",
    };

    it("should update assessment successfully", async () => {
      const mockClient = supabaseService.client as any;

      // Mock assessment verification
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ id: mockAssessmentId })
      );

      // Mock update
      const updatedAssessment = { ...mockAssessment, ...updates };
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(updatedAssessment)
      );

      const result = await service.updateAssessment(
        mockAssessmentId,
        updates,
        mockOrganizationId
      );

      expect(result.overall_score).toBe(5);
      expect(result.notes).toBe("Updated notes");
    });

    it("should recalculate scores when completed_items updated", async () => {
      const mockClient = supabaseService.client as any;

      const updatesWithItems = {
        completed_items: [
          { id: "item-1", completed: true, points_earned: 5, notes: "" , photo_urls: []},
          { id: "item-2", completed: true, points_earned: 5, notes: "" , photo_urls: []},
        ],
      };

      // Mock assessment verification
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ id: mockAssessmentId })
      );

      let capturedUpdates: any;
      mockClient.update.mockImplementation((data: any) => {
        capturedUpdates = data;
        return mockClient;
      });

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse({ ...mockAssessment, ...updatesWithItems })
      );

      await service.updateAssessment(
        mockAssessmentId,
        updatesWithItems,
        mockOrganizationId
      );

      expect(capturedUpdates).toHaveProperty("percentage_score");
      expect(capturedUpdates).toHaveProperty("total_points_earned");
      expect(capturedUpdates).toHaveProperty("max_possible_points");
    });

    it("should throw NotFoundException if assessment not found", async () => {
      const mockClient = supabaseService.client as any;

      mockClient.single.mockResolvedValueOnce(mockSupabaseResponse(null));

      await expect(
        service.updateAssessment(
          mockAssessmentId,
          updates,
          mockOrganizationId
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getOrganizationQualityMetrics", () => {
    it("should return empty metrics when no assessments", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(mockSupabaseResponse([]));

      const result = await service.getOrganizationQualityMetrics(
        mockOrganizationId
      );

      expect(result.total_assessments).toBe(0);
      expect(result.average_score).toBe(0);
      expect(result.average_percentage).toBe(0);
      expect(result.score_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });

    it("should calculate metrics correctly with assessments", async () => {
      const mockClient = supabaseService.client as any;

      const mockAssessments = [
        {
          id: "assessment-1",
          overall_score: 5,
          percentage_score: 100,
          created_at: "2024-01-15T10:00:00Z",
          jobs: { organization_id: mockOrganizationId, service_type: "standard" },
          quality_checklists: { service_type: "standard", name: "Standard Checklist" },
        },
        {
          id: "assessment-2",
          overall_score: 4,
          percentage_score: 80,
          created_at: "2024-01-20T10:00:00Z",
          jobs: { organization_id: mockOrganizationId, service_type: "standard" },
          quality_checklists: { service_type: "standard", name: "Standard Checklist" },
        },
        {
          id: "assessment-3",
          overall_score: 3,
          percentage_score: 60,
          created_at: "2024-02-10T10:00:00Z",
          jobs: { organization_id: mockOrganizationId, service_type: "deep" },
          quality_checklists: { service_type: "deep", name: "Deep Checklist" },
        },
      ];

      mockClient.mockResolvedValueOnce(mockSupabaseResponse(mockAssessments));

      const result = await service.getOrganizationQualityMetrics(
        mockOrganizationId
      );

      expect(result.total_assessments).toBe(3);
      expect(result.average_score).toBeCloseTo(4, 0);
      expect(result.average_percentage).toBeCloseTo(80, 0);
      expect(result.score_distribution[5]).toBe(1);
      expect(result.score_distribution[4]).toBe(1);
      expect(result.score_distribution[3]).toBe(1);
      expect(result.by_service_type).toHaveProperty("standard");
      expect(result.by_service_type).toHaveProperty("deep");
      expect(result.monthly_trends).toHaveProperty("2024-01");
      expect(result.monthly_trends).toHaveProperty("2024-02");
    });

    it("should calculate averages by service type", async () => {
      const mockClient = supabaseService.client as any;

      const mockAssessments = [
        {
          id: "1",
          overall_score: 5,
          percentage_score: 100,
          created_at: "2024-01-15T10:00:00Z",
          jobs: { service_type: "standard" },
          quality_checklists: { service_type: "standard" },
        },
        {
          id: "2",
          overall_score: 3,
          percentage_score: 60,
          created_at: "2024-01-16T10:00:00Z",
          jobs: { service_type: "standard" },
          quality_checklists: { service_type: "standard" },
        },
      ];

      mockClient.mockResolvedValueOnce(mockSupabaseResponse(mockAssessments));

      const result = await service.getOrganizationQualityMetrics(
        mockOrganizationId
      );

      expect(result.by_service_type.standard.count).toBe(2);
      expect(result.by_service_type.standard.average_score).toBe(4);
      expect(result.by_service_type.standard.average_percentage).toBe(80);
    });

    it("should limit quality trends to last 12 months", async () => {
      const mockClient = supabaseService.client as any;

      // Create 15 months of data
      const mockAssessments = Array.from({ length: 15 }, (_, i) => ({
        id: `assessment-${i}`,
        overall_score: 4,
        percentage_score: 80,
        created_at: new Date(2023, i, 15).toISOString(),
        jobs: { service_type: "standard" },
        quality_checklists: { service_type: "standard" },
      }));

      mockClient.mockResolvedValueOnce(mockSupabaseResponse(mockAssessments));

      const result = await service.getOrganizationQualityMetrics(
        mockOrganizationId
      );

      expect(result.quality_trends.length).toBeLessThanOrEqual(12);
    });
  });

  describe("getQualityIssues", () => {
    it("should get quality issues with medium severity", async () => {
      const mockClient = supabaseService.client as any;

      const mockIssues = [
        {
          id: "assessment-1",
          overall_score: 2,
          percentage_score: 40,
          notes: "Multiple issues found",
          completed_items: mockCompletedItems,
          created_at: "2024-01-15T10:00:00Z",
          jobs: { id: mockJobId, job_number: "JOB-001", service_type: "standard" },
          customers: { id: "customer-1", name: "Customer Name", email: "customer@example.com" },
        },
      ];

      mockClient.mockResolvedValueOnce(mockSupabaseResponse(mockIssues));

      const result = await service.getQualityIssues(mockOrganizationId, "medium");

      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty("assessment_id");
      expect(result[0]).toHaveProperty("job");
      expect(result[0]).toHaveProperty("customer");
      expect(result[0]).toHaveProperty("score");
      expect(result[0]).toHaveProperty("issues");
      expect(result[0].score).toBe(2);
    });

    it("should use correct threshold for high severity", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(mockSupabaseResponse([]));

      await service.getQualityIssues(mockOrganizationId, "high");

      expect(mockClient.lt).toHaveBeenCalledWith("overall_score", 2);
    });

    it("should use correct threshold for low severity", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(mockSupabaseResponse([]));

      await service.getQualityIssues(mockOrganizationId, "low");

      expect(mockClient.lt).toHaveBeenCalledWith("overall_score", 4);
    });

    it("should limit results to 50", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(mockSupabaseResponse([]));

      await service.getQualityIssues(mockOrganizationId);

      expect(mockClient.limit).toHaveBeenCalledWith(50);
    });
  });

  describe("generateQualityReport", () => {
    it("should generate comprehensive quality report", async () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-01-31";

      // Mock metrics
      jest.spyOn(service, "getOrganizationQualityMetrics").mockResolvedValueOnce({
        total_assessments: 10,
        average_score: 4,
        average_percentage: 80,
        score_distribution: { 1: 0, 2: 1, 3: 2, 4: 4, 5: 3 },
        by_service_type: {},
        monthly_trends: {},
        quality_trends: [],
      });

      // Mock issues
      jest.spyOn(service, "getQualityIssues").mockResolvedValueOnce([]);

      // Mock photos
      jest.spyOn(photoDocumentationService, "organizePhotosByDate").mockResolvedValueOnce({
        "2024-01-15": [{ id: "photo-1" }],
        "2024-01-20": [{ id: "photo-2" }, { id: "photo-3" }],
      });

      const result = await service.generateQualityReport(
        mockOrganizationId,
        dateFrom,
        dateTo
      );

      expect(result).toHaveProperty("period");
      expect(result.period.from).toBe(dateFrom);
      expect(result.period.to).toBe(dateTo);
      expect(result).toHaveProperty("quality_metrics");
      expect(result).toHaveProperty("quality_issues");
      expect(result).toHaveProperty("photo_documentation");
      expect(result).toHaveProperty("recommendations");
      expect(result.photo_documentation.total_photos).toBe(3);
    });
  });

  describe("Score Calculation", () => {
    it("should calculate scores correctly for all completed items", () => {
      const items: CompletedChecklistItem[] = [
        { id: "1", completed: true, points_earned: 5, notes: "" , photo_urls: []},
        { id: "2", completed: true, points_earned: 5, notes: "" , photo_urls: []},
        { id: "3", completed: true, points_earned: 5, notes: "" , photo_urls: []},
      ];

      const result = service["calculateScores"](items);

      expect(result.totalPoints).toBe(15);
      expect(result.maxPoints).toBe(15);
      expect(result.percentage).toBe(100);
    });

    it("should calculate scores correctly for partial completion", () => {
      const items: CompletedChecklistItem[] = [
        { id: "1", completed: true, points_earned: 5, notes: "" , photo_urls: []},
        { id: "2", completed: false, points_earned: 0, notes: "" , photo_urls: []},
        { id: "3", completed: true, points_earned: 3, notes: "" , photo_urls: []},
      ];

      const result = service["calculateScores"](items);

      expect(result.totalPoints).toBe(8);
      expect(result.percentage).toBeLessThan(100);
      expect(result.percentage).toBeGreaterThan(0);
    });

    it("should handle empty items array", () => {
      const result = service["calculateScores"]([]);

      expect(result.totalPoints).toBe(0);
      expect(result.maxPoints).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe("Extract Issues", () => {
    it("should extract incomplete items as issues", () => {
      const items: CompletedChecklistItem[] = [
        { id: "item-1", completed: false, points_earned: 0, notes: "" , photo_urls: []},
        { id: "item-2", completed: true, points_earned: 5, notes: "" , photo_urls: []},
      ];

      const result = service["extractIssuesFromCompletedItems"](items);

      expect(result).toContain("Incomplete: item-1");
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("should extract issue notes", () => {
      const items: CompletedChecklistItem[] = [
        {
          id: "item-1",
          completed: true,
          points_earned: 3,
          notes: "Found issue with windows",
        },
      ];

      const result = service["extractIssuesFromCompletedItems"](items);

      expect(result.some((issue) => issue.includes("Issue noted"))).toBe(true);
    });
  });

  describe("Quality Recommendations", () => {
    it("should recommend training when average score is low", () => {
      const metrics = {
        average_score: 3,
        average_percentage: 70,
        by_service_type: {},
      };

      const result = service["generateQualityRecommendations"](metrics, []);

      expect(result.some((r) => r.includes("training"))).toBe(true);
    });

    it("should recommend checklist review when completion rate is low", () => {
      const metrics = {
        average_score: 4,
        average_percentage: 75,
        by_service_type: {},
      };

      const result = service["generateQualityRecommendations"](metrics, []);

      expect(result.some((r) => r.includes("checklist"))).toBe(true);
    });

    it("should identify low performing services", () => {
      const metrics = {
        average_score: 4,
        average_percentage: 85,
        by_service_type: {
          standard: { average_score: 4.5 },
          deep: { average_score: 3 },
        },
      };

      const result = service["generateQualityRecommendations"](metrics, []);

      expect(result.some((r) => r.includes("deep"))).toBe(true);
    });

    it("should recommend quality control for many issues", () => {
      const metrics = {
        average_score: 4,
        average_percentage: 85,
        by_service_type: {},
      };

      const manyIssues = Array(15).fill({ assessment_id: "test" });

      const result = service["generateQualityRecommendations"](metrics, manyIssues);

      expect(result.some((r) => r.includes("quality control"))).toBe(true);
    });

    it("should provide positive feedback when metrics are good", () => {
      const metrics = {
        average_score: 4.5,
        average_percentage: 90,
        by_service_type: {
          standard: { average_score: 4.5 },
        },
      };

      const result = service["generateQualityRecommendations"](metrics, []);

      expect(result.some((r) => r.includes("good"))).toBe(true);
    });
  });
});
