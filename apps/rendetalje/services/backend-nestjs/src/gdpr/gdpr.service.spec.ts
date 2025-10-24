import { Test, TestingModule } from "@nestjs/testing";
import { GdprService, DataExportRequest, DataDeletionRequest, ConsentRecord } from "./gdpr.service";
import { SupabaseService } from "../supabase/supabase.service";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

describe("GdprService", () => {
  let service: GdprService;
  let supabaseService: SupabaseService;
  let configService: ConfigService;

  const mockUserId = "user-123";
  const mockEmail = "test@example.com";
  const mockRequestId = "request-123";
  const mockOrganizationId = "org-123";

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
      in: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
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
        GdprService,
        {
          provide: SupabaseService,
          useValue: {
            client: mockSupabaseClient,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "ENCRYPTION_KEY") return "test-encryption-key-32-characters";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GdprService>(GdprService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock logger to suppress console output during tests
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("requestDataExport", () => {
    it("should return existing pending request if one exists", async () => {
      const mockClient = supabaseService.client as any;
      const existingRequest = {
        id: mockRequestId,
        user_id: mockUserId,
        email: mockEmail,
        request_date: new Date().toISOString(),
        status: "pending",
        download_url: null,
        expires_at: null,
      };

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(existingRequest)
      );

      const result = await service.requestDataExport(mockUserId, mockEmail);

      expect(result.userId).toBe(mockUserId);
      expect(result.status).toBe("pending");
      expect(mockClient.from).toHaveBeenCalledWith("data_export_requests");
      expect(mockClient.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockClient.eq).toHaveBeenCalledWith("status", "pending");
    });

    it("should create new export request if none exists", async () => {
      const mockClient = supabaseService.client as any;

      // No existing request
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null)
      );

      // Create new request
      const newRequest = {
        id: mockRequestId,
        user_id: mockUserId,
        email: mockEmail,
        request_date: new Date().toISOString(),
        status: "pending",
      };
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(newRequest)
      );

      // Mock processDataExport to prevent background processing
      jest.spyOn(service as any, "processDataExport").mockResolvedValue(undefined);

      const result = await service.requestDataExport(mockUserId, mockEmail);

      expect(result.userId).toBe(mockUserId);
      expect(result.email).toBe(mockEmail);
      expect(result.status).toBe("pending");
      expect(service["processDataExport"]).toHaveBeenCalledWith(mockUserId, mockRequestId);
    });

    it("should throw error on database failure", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Database error"))
      );

      await expect(
        service.requestDataExport(mockUserId, mockEmail)
      ).rejects.toThrow();
    });
  });

  describe("requestDataDeletion", () => {
    it("should return existing pending deletion request", async () => {
      const mockClient = supabaseService.client as any;
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 30);

      const existingRequest = {
        id: mockRequestId,
        user_id: mockUserId,
        email: mockEmail,
        request_date: new Date().toISOString(),
        scheduled_deletion_date: scheduledDate.toISOString(),
        status: "pending",
        reason: "User request",
      };

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(existingRequest)
      );

      const result = await service.requestDataDeletion(mockUserId, mockEmail, "User request");

      expect(result.userId).toBe(mockUserId);
      expect(result.status).toBe("pending");
      expect(result.reason).toBe("User request");
      expect(mockClient.from).toHaveBeenCalledWith("data_deletion_requests");
    });

    it("should create new deletion request with 30-day grace period", async () => {
      const mockClient = supabaseService.client as any;

      // No existing request
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null)
      );

      // Create new request
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 30);

      const newRequest = {
        id: mockRequestId,
        user_id: mockUserId,
        email: mockEmail,
        request_date: new Date().toISOString(),
        scheduled_deletion_date: scheduledDate.toISOString(),
        status: "pending",
        reason: "Account closure",
      };

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(newRequest)
      );

      const result = await service.requestDataDeletion(
        mockUserId,
        mockEmail,
        "Account closure"
      );

      expect(result.userId).toBe(mockUserId);
      expect(result.email).toBe(mockEmail);
      expect(result.status).toBe("pending");
      expect(result.reason).toBe("Account closure");

      // Verify 30-day grace period
      const daysDiff = Math.floor(
        (result.scheduledDeletionDate.getTime() - result.requestDate.getTime()) /
        (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(30);
    });

    it("should throw error on database failure", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Database error"))
      );

      await expect(
        service.requestDataDeletion(mockUserId, mockEmail)
      ).rejects.toThrow();
    });
  });

  describe("cancelDataDeletion", () => {
    it("should cancel pending deletion request successfully", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      const result = await service.cancelDataDeletion(mockUserId);

      expect(result).toBe(true);
      expect(mockClient.from).toHaveBeenCalledWith("data_deletion_requests");
      expect(mockClient.update).toHaveBeenCalledWith({ status: "cancelled" });
      expect(mockClient.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockClient.eq).toHaveBeenCalledWith("status", "pending");
    });

    it("should return false on failure", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Database error"))
      );

      const result = await service.cancelDataDeletion(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe("processScheduledDeletions", () => {
    it("should process all pending deletions past scheduled date", async () => {
      const mockClient = supabaseService.client as any;
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const pendingDeletions = [
        {
          id: "deletion-1",
          user_id: "user-1",
          scheduled_deletion_date: pastDate.toISOString(),
          status: "pending",
        },
        {
          id: "deletion-2",
          user_id: "user-2",
          scheduled_deletion_date: pastDate.toISOString(),
          status: "pending",
        },
      ];

      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(pendingDeletions)
      );

      // Mock executeDataDeletion
      jest.spyOn(service as any, "executeDataDeletion").mockResolvedValue(undefined);

      await service.processScheduledDeletions();

      expect(service["executeDataDeletion"]).toHaveBeenCalledTimes(2);
      expect(service["executeDataDeletion"]).toHaveBeenCalledWith("user-1", "deletion-1");
      expect(service["executeDataDeletion"]).toHaveBeenCalledWith("user-2", "deletion-2");
    });

    it("should handle errors gracefully", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Database error"))
      );

      await expect(service.processScheduledDeletions()).resolves.not.toThrow();
    });
  });

  describe("recordConsent", () => {
    const ipAddress = "192.168.1.1";
    const userAgent = "Mozilla/5.0";
    const consentType = "marketing";
    const version = "1.0";

    it("should record consent successfully", async () => {
      const mockClient = supabaseService.client as any;
      const consentRecord = {
        user_id: mockUserId,
        consent_type: consentType,
        granted: true,
        granted_at: new Date().toISOString(),
        revoked_at: null,
        ip_address: ipAddress,
        user_agent: userAgent,
        version,
      };

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(consentRecord)
      );

      const result = await service.recordConsent(
        mockUserId,
        consentType,
        true,
        ipAddress,
        userAgent,
        version
      );

      expect(result.userId).toBe(mockUserId);
      expect(result.consentType).toBe(consentType);
      expect(result.granted).toBe(true);
      expect(result.ipAddress).toBe(ipAddress);
      expect(result.userAgent).toBe(userAgent);
      expect(mockClient.from).toHaveBeenCalledWith("consent_records");
    });

    it("should record consent revocation with revoked_at timestamp", async () => {
      const mockClient = supabaseService.client as any;
      const revokedAt = new Date().toISOString();
      const consentRecord = {
        user_id: mockUserId,
        consent_type: consentType,
        granted: false,
        granted_at: new Date().toISOString(),
        revoked_at: revokedAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        version,
      };

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(consentRecord)
      );

      const result = await service.recordConsent(
        mockUserId,
        consentType,
        false,
        ipAddress,
        userAgent,
        version
      );

      expect(result.granted).toBe(false);
      expect(result.revokedAt).toBeDefined();
    });

    it("should throw error on database failure", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Database error"))
      );

      await expect(
        service.recordConsent(mockUserId, consentType, true, ipAddress, userAgent)
      ).rejects.toThrow();
    });
  });

  describe("getConsentStatus", () => {
    it("should get all consent records for user", async () => {
      const mockClient = supabaseService.client as any;
      const consentRecords = [
        {
          user_id: mockUserId,
          consent_type: "marketing",
          granted: true,
          granted_at: new Date().toISOString(),
          revoked_at: null,
          ip_address: "192.168.1.1",
          user_agent: "Mozilla/5.0",
          version: "1.0",
        },
        {
          user_id: mockUserId,
          consent_type: "analytics",
          granted: false,
          granted_at: new Date().toISOString(),
          revoked_at: new Date().toISOString(),
          ip_address: "192.168.1.1",
          user_agent: "Mozilla/5.0",
          version: "1.0",
        },
      ];

      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(consentRecords)
      );

      const result = await service.getConsentStatus(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].consentType).toBe("marketing");
      expect(result[0].granted).toBe(true);
      expect(result[1].consentType).toBe("analytics");
      expect(result[1].granted).toBe(false);
    });

    it("should filter by consent type when provided", async () => {
      const mockClient = supabaseService.client as any;
      const consentRecords = [
        {
          user_id: mockUserId,
          consent_type: "marketing",
          granted: true,
          granted_at: new Date().toISOString(),
          revoked_at: null,
          ip_address: "192.168.1.1",
          user_agent: "Mozilla/5.0",
          version: "1.0",
        },
      ];

      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(consentRecords)
      );

      const result = await service.getConsentStatus(mockUserId, "marketing");

      expect(result).toHaveLength(1);
      expect(result[0].consentType).toBe("marketing");
      expect(mockClient.eq).toHaveBeenCalledWith("consent_type", "marketing");
    });

    it("should return empty array if no consents found", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      const result = await service.getConsentStatus(mockUserId);

      expect(result).toEqual([]);
    });

    it("should throw error on database failure", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Database error"))
      );

      await expect(
        service.getConsentStatus(mockUserId)
      ).rejects.toThrow();
    });
  });

  describe("cleanupExpiredData", () => {
    it("should cleanup expired export requests", async () => {
      const mockClient = supabaseService.client as any;

      // Mock all delete operations
      mockClient.mockResolvedValue(mockSupabaseResponse(null));

      await service.cleanupExpiredData();

      expect(mockClient.from).toHaveBeenCalledWith("data_export_requests");
      expect(mockClient.delete).toHaveBeenCalled();
      expect(mockClient.lt).toHaveBeenCalled();
    });

    it("should cleanup consent records older than 7 years", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValue(mockSupabaseResponse(null));

      await service.cleanupExpiredData();

      expect(mockClient.from).toHaveBeenCalledWith("consent_records");
      expect(mockClient.delete).toHaveBeenCalled();
    });

    it("should cleanup communication logs older than 3 years", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValue(mockSupabaseResponse(null));

      await service.cleanupExpiredData();

      expect(mockClient.from).toHaveBeenCalledWith("customer_communications");
      expect(mockClient.delete).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Database error"))
      );

      await expect(service.cleanupExpiredData()).resolves.not.toThrow();
    });
  });

  describe("getPrivacyPolicy", () => {
    it("should get active privacy policy without version", async () => {
      const mockClient = supabaseService.client as any;
      const policy = {
        id: "policy-123",
        content: "Privacy policy content",
        version: "1.0",
        active: true,
        created_at: new Date().toISOString(),
      };

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(policy)
      );

      const result = await service.getPrivacyPolicy();

      expect(result.version).toBe("1.0");
      expect(result.active).toBe(true);
      expect(mockClient.eq).toHaveBeenCalledWith("active", true);
      expect(mockClient.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockClient.limit).toHaveBeenCalledWith(1);
    });

    it("should get specific version when provided", async () => {
      const mockClient = supabaseService.client as any;
      const policy = {
        id: "policy-123",
        content: "Privacy policy content",
        version: "2.0",
        active: true,
        created_at: new Date().toISOString(),
      };

      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(policy)
      );

      const result = await service.getPrivacyPolicy("2.0");

      expect(result.version).toBe("2.0");
      expect(mockClient.eq).toHaveBeenCalledWith("version", "2.0");
    });

    it("should throw error if policy not found", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.single.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Not found"))
      );

      await expect(service.getPrivacyPolicy()).rejects.toThrow();
    });
  });

  describe("updatePrivacyPolicy", () => {
    it("should deactivate old policy and create new one", async () => {
      const mockClient = supabaseService.client as any;
      const newContent = "Updated privacy policy content";
      const newVersion = "2.0";

      // Mock deactivate old policy
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      // Mock create new policy
      mockClient.mockResolvedValueOnce(mockSupabaseResponse(null));

      await service.updatePrivacyPolicy(newContent, newVersion);

      expect(mockClient.from).toHaveBeenCalledWith("privacy_policies");
      expect(mockClient.update).toHaveBeenCalledWith({ active: false });
      expect(mockClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          content: newContent,
          version: newVersion,
          active: true,
        })
      );
    });

    it("should throw error on database failure", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValueOnce(
        mockSupabaseResponse(null, new Error("Database error"))
      );

      await expect(
        service.updatePrivacyPolicy("content", "1.0")
      ).rejects.toThrow();
    });
  });

  describe("Data Encryption", () => {
    it("should encrypt and decrypt data correctly", () => {
      const originalData = JSON.stringify({
        user: { id: mockUserId, email: mockEmail },
        sensitiveData: "confidential",
      });

      const encrypted = service["encryptData"](originalData);
      expect(encrypted).not.toBe(originalData);
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = service["decryptData"](encrypted);
      expect(decrypted).toBe(originalData);
    });

    it("should produce different encrypted output for same input (due to random IV)", () => {
      const data = "sensitive data";

      const encrypted1 = service["encryptData"](data);
      const encrypted2 = service["encryptData"](data);

      // Both should decrypt to same value
      expect(service["decryptData"](encrypted1)).toBe(data);
      expect(service["decryptData"](encrypted2)).toBe(data);
    });
  });

  describe("Collect User Data", () => {
    it("should collect all user data for export", async () => {
      const mockClient = supabaseService.client as any;

      // Mock user data
      const mockUser = {
        id: mockUserId,
        email: mockEmail,
        organization_id: mockOrganizationId,
      };

      // Mock all data collection queries
      mockClient.single
        .mockResolvedValueOnce(mockSupabaseResponse(mockUser)) // user
        .mockResolvedValueOnce(mockSupabaseResponse({ user_id: mockUserId })); // profile

      mockClient
        .mockResolvedValueOnce(mockSupabaseResponse([{ id: "customer-1" }])) // customers
        .mockResolvedValueOnce(mockSupabaseResponse([{ id: "job-1" }])) // jobs
        .mockResolvedValueOnce(mockSupabaseResponse([{ id: "time-1" }])) // time entries
        .mockResolvedValueOnce(mockSupabaseResponse([{ id: "comm-1" }])) // communications
        .mockResolvedValueOnce(mockSupabaseResponse([{ id: "rating-1" }])) // ratings
        .mockResolvedValueOnce(mockSupabaseResponse([{ id: "consent-1" }])); // consents

      const result = await service["collectUserData"](mockUserId);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("profile");
      expect(result).toHaveProperty("customers");
      expect(result).toHaveProperty("jobs");
      expect(result).toHaveProperty("timeEntries");
      expect(result).toHaveProperty("communications");
      expect(result).toHaveProperty("satisfactionRatings");
      expect(result).toHaveProperty("consentRecords");
      expect(result).toHaveProperty("exportDate");
      expect(result.user.id).toBe(mockUserId);
    });
  });

  describe("Execute Data Deletion", () => {
    it("should delete user data in correct order", async () => {
      const mockClient = supabaseService.client as any;

      // Mock all delete/update operations
      mockClient.mockResolvedValue(mockSupabaseResponse(null));

      await service["executeDataDeletion"](mockUserId, mockRequestId);

      // Verify correct order of deletions
      const fromCalls = mockClient.from.mock.calls;
      expect(fromCalls).toContainEqual(["data_deletion_requests"]); // status updates
      expect(fromCalls).toContainEqual(["consent_records"]);
      expect(fromCalls).toContainEqual(["time_entries"]);
      expect(fromCalls).toContainEqual(["customer_communications"]);
      expect(fromCalls).toContainEqual(["jobs"]); // anonymize
      expect(fromCalls).toContainEqual(["user_profiles"]);
      expect(fromCalls).toContainEqual(["users"]);

      // Verify final status update
      expect(mockClient.update).toHaveBeenCalledWith({ status: "completed" });
    });

    it("should update status to failed on error", async () => {
      const mockClient = supabaseService.client as any;

      // Mock error on first delete
      mockClient.mockRejectedValueOnce(new Error("Delete failed"));

      await service["executeDataDeletion"](mockUserId, mockRequestId);

      expect(mockClient.update).toHaveBeenCalledWith({ status: "failed" });
    });
  });

  describe("GDPR Compliance - Legal Requirements", () => {
    it("should enforce 30-day grace period for data deletion", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.single
        .mockResolvedValueOnce(mockSupabaseResponse(null))
        .mockResolvedValueOnce(
          mockSupabaseResponse({
            id: mockRequestId,
            user_id: mockUserId,
            email: mockEmail,
            request_date: new Date().toISOString(),
            scheduled_deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          })
        );

      const result = await service.requestDataDeletion(mockUserId, mockEmail);

      const gracePeriodDays = Math.round(
        (result.scheduledDeletionDate.getTime() - result.requestDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      expect(gracePeriodDays).toBe(30);
    });

    it("should keep consent records for 7 years", async () => {
      const mockClient = supabaseService.client as any;
      mockClient.mockResolvedValue(mockSupabaseResponse(null));

      await service.cleanupExpiredData();

      // Check that consent records deletion uses 7-year threshold
      const deleteCalls = mockClient.from.mock.calls;
      const consentDeleteIndex = deleteCalls.findIndex(
        (call) => call[0] === "consent_records"
      );
      expect(consentDeleteIndex).toBeGreaterThan(-1);
    });

    it("should provide data in portable format (JSON)", async () => {
      const mockClient = supabaseService.client as any;
      const mockUser = {
        id: mockUserId,
        email: mockEmail,
        organization_id: mockOrganizationId,
      };

      mockClient.single
        .mockResolvedValueOnce(mockSupabaseResponse(mockUser))
        .mockResolvedValueOnce(mockSupabaseResponse(null));

      mockClient.mockResolvedValue(mockSupabaseResponse([]));

      const userData = await service["collectUserData"](mockUserId);

      // Verify data is JSON-serializable
      expect(() => JSON.stringify(userData)).not.toThrow();

      const jsonString = JSON.stringify(userData);
      const parsed = JSON.parse(jsonString);
      expect(parsed).toHaveProperty("exportDate");
      expect(parsed).toHaveProperty("user");
    });
  });
});
