/**
 * API Client Integration Tests
 *
 * Tests the centralized API client with mocked fetch responses
 */

import { apiClient, ApiError, User, Job, Customer } from "@/lib/api-client";
import { useAuthStore } from "@/store/authStore";

// Mock fetch globally
global.fetch = jest.fn();

// Helper to create mock responses
const mockResponse = (status: number, data: unknown) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => data,
  } as Response);
};

describe("ApiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth store
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  });

  describe("Authentication", () => {
    it("should login successfully", async () => {
      const mockUser: User = {
        id: "1",
        organization_id: "org1",
        email: "test@example.com",
        name: "Test User",
        role: "employee",
        is_active: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(200, { user: mockUser, accessToken: "test-token" })
      );

      const result = await apiClient.login("test@example.com", "password");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            email: "test@example.com",
            password: "password",
          }),
        })
      );

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe("test-token");
    });

    it("should handle login errors", async () => {
      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(401, { message: "Invalid credentials" })
      );

      await expect(
        apiClient.login("test@example.com", "wrong-password")
      ).rejects.toThrow(ApiError);
    });

    it("should register successfully", async () => {
      const mockUser: User = {
        id: "1",
        organization_id: "org1",
        email: "new@example.com",
        name: "New User",
        role: "employee",
        is_active: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(200, { user: mockUser, accessToken: "test-token" })
      );

      const result = await apiClient.register({
        email: "new@example.com",
        password: "password123",
        name: "New User",
        organizationId: "org1",
      });

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe("test-token");
    });
  });

  describe("Jobs", () => {
    beforeEach(() => {
      // Set auth token for authenticated requests
      useAuthStore.setState({ token: "test-token" });
    });

    it("should fetch jobs list", async () => {
      const mockJobs: Job[] = [
        {
          id: "1",
          organization_id: "org1",
          customer_id: "cust1",
          title: "Test Job",
          status: "pending",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(200, mockJobs)
      );

      const result = await apiClient.getJobs();

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/jobs",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );

      expect(result).toEqual(mockJobs);
    });

    it("should fetch jobs with filters", async () => {
      (fetch as jest.Mock).mockImplementation(() => mockResponse(200, []));

      await apiClient.getJobs({ status: "completed", customerId: "cust1" });

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/jobs?status=completed&customerId=cust1",
        expect.anything()
      );
    });

    it("should create a job", async () => {
      const newJob: Partial<Job> = {
        customer_id: "cust1",
        title: "New Job",
        status: "pending",
      };

      const mockCreatedJob: Job = {
        id: "2",
        organization_id: "org1",
        ...newJob,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      } as Job;

      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(200, mockCreatedJob)
      );

      const result = await apiClient.createJob(newJob);

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/jobs",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(newJob),
        })
      );

      expect(result).toEqual(mockCreatedJob);
    });

    it("should update a job", async () => {
      const updates: Partial<Job> = { status: "completed" };
      const mockUpdatedJob: Job = {
        id: "1",
        organization_id: "org1",
        customer_id: "cust1",
        title: "Test Job",
        status: "completed",
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(200, mockUpdatedJob)
      );

      const result = await apiClient.updateJob("1", updates);

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/jobs/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updates),
        })
      );

      expect(result).toEqual(mockUpdatedJob);
    });

    it("should delete a job", async () => {
      (fetch as jest.Mock).mockImplementation(() => mockResponse(204, {}));

      await apiClient.deleteJob("1");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/jobs/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Customers", () => {
    beforeEach(() => {
      useAuthStore.setState({ token: "test-token" });
    });

    it("should fetch customers list", async () => {
      const mockCustomers: Customer[] = [
        {
          id: "1",
          organization_id: "org1",
          name: "Test Customer",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(200, mockCustomers)
      );

      const result = await apiClient.getCustomers();

      expect(result).toEqual(mockCustomers);
    });

    it("should create a customer", async () => {
      const newCustomer: Partial<Customer> = {
        name: "New Customer",
        email: "customer@example.com",
        phone: "12345678",
      };

      const mockCreatedCustomer: Customer = {
        id: "2",
        organization_id: "org1",
        ...newCustomer,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      } as Customer;

      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(200, mockCreatedCustomer)
      );

      const result = await apiClient.createCustomer(newCustomer);

      expect(result).toEqual(mockCreatedCustomer);
    });

    it("should update a customer", async () => {
      const updates: Partial<Customer> = { phone: "87654321" };
      const mockUpdatedCustomer: Customer = {
        id: "1",
        organization_id: "org1",
        name: "Test Customer",
        phone: "87654321",
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(200, mockUpdatedCustomer)
      );

      const result = await apiClient.updateCustomer("1", updates);

      expect(result).toEqual(mockUpdatedCustomer);
    });

    it("should delete a customer", async () => {
      (fetch as jest.Mock).mockImplementation(() => mockResponse(204, {}));

      await apiClient.deleteCustomer("1");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/customers/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      useAuthStore.setState({ token: "test-token" });
    });

    it("should throw ApiError on 400", async () => {
      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(400, { message: "Bad request" })
      );

      await expect(apiClient.getJobs()).rejects.toThrow(ApiError);
    });

    it("should throw ApiError on 404", async () => {
      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(404, { message: "Not found" })
      );

      await expect(apiClient.getJob("999")).rejects.toThrow(ApiError);
    });

    it("should throw ApiError on 500", async () => {
      (fetch as jest.Mock).mockImplementation(() =>
        mockResponse(500, { message: "Internal server error" })
      );

      await expect(apiClient.getJobs()).rejects.toThrow(ApiError);
    });
  });

  describe("Token Refresh", () => {
    it("should retry request after token refresh on 401", async () => {
      const mockJob: Job = {
        id: "1",
        organization_id: "org1",
        customer_id: "cust1",
        title: "Test Job",
        status: "pending",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      // First call returns 401, second (refresh) returns new token, third returns data
      (fetch as jest.Mock)
        .mockImplementationOnce(() =>
          mockResponse(401, { message: "Unauthorized" })
        )
        .mockImplementationOnce(() =>
          mockResponse(200, { accessToken: "new-token" })
        )
        .mockImplementationOnce(() => mockResponse(200, mockJob));

      useAuthStore.setState({ token: "old-token" });

      const result = await apiClient.getJob("1");

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockJob);
      expect(useAuthStore.getState().token).toBe("new-token");
    });

    it("should logout if token refresh fails", async () => {
      (fetch as jest.Mock)
        .mockImplementationOnce(() =>
          mockResponse(401, { message: "Unauthorized" })
        )
        .mockImplementationOnce(() =>
          mockResponse(401, { message: "Invalid token" })
        );

      useAuthStore.setState({ token: "invalid-token", isAuthenticated: true });

      await expect(apiClient.getJob("1")).rejects.toThrow();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
    });
  });
});
