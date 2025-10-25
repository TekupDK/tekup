import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { PrismaService } from "../database/prisma.service";
import { Customer } from "./entities/customer.entity";
import { CreateCustomerDto, UpdateCustomerDto, CustomerFiltersDto } from "./dto";

describe("CustomersService", () => {
  let service: CustomersService;
  let prismaService: PrismaService;

  const mockOrganizationId = "org-123";
  const mockCustomerId = "customer-123";

  const mockCustomer: Customer = {
    id: mockCustomerId,
    organization_id: mockOrganizationId,
    name: "Test Customer",
    email: "test@example.com",
    phone: "+45 12345678",
    address: {
      street: "Test Street 123",
      city: "Copenhagen",
      postal_code: "1000",
      country: "Denmark",
    },
    preferences: {
      contact_method: "email"
    },
    total_jobs: 10,
    total_revenue: 15000,
    satisfaction_score: 4.5,
    is_active: true,
    notes: "Good customer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: {
            customers: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    const pagination = { page: 1, limit: 10 };

    it("should return paginated customers", async () => {
      const mockCustomers = [mockCustomer];
      const mockCount = 1;

      jest.spyOn(prismaService.customers, "findMany").mockResolvedValue(mockCustomers as any);
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(mockCount);

      const result = await service.findAll(mockOrganizationId, pagination);

      expect(result.data).toEqual(mockCustomers);
      expect(result.total).toBe(mockCount);
      expect(result.page).toBe(pagination.page);
      expect(result.limit).toBe(pagination.limit);
      expect(prismaService.customers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organization_id: mockOrganizationId,
          }),
          skip: 0,
          take: 10,
        })
      );
    });

    it("should apply search filter", async () => {
      const pagination = { page: 1, limit: 10, search: "Test" };

      jest.spyOn(prismaService.customers, "findMany").mockResolvedValue([]);
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(0);

      await service.findAll(mockOrganizationId, pagination);

      expect(prismaService.customers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe("findById", () => {
    it("should return customer by id", async () => {
      jest.spyOn(prismaService.customers, "findFirst").mockResolvedValue(mockCustomer as any);

      const result = await service.findById(mockCustomerId, mockOrganizationId);

      expect(result).toEqual(mockCustomer);
      expect(prismaService.customers.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCustomerId,
          organization_id: mockOrganizationId,
        },
      });
    });

    it("should throw NotFoundException if customer not found", async () => {
      jest.spyOn(prismaService.customers, "findFirst").mockResolvedValue(null);

      await expect(
        service.findById(mockCustomerId, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    const createDto: CreateCustomerDto = {
      name: "New Customer",
      email: "new@example.com",
      phone: "+45 87654321",
      address: {
        street: "New Street 456",
        city: "Aarhus",
        postal_code: "8000",
        country: "Denmark",
      },
    };

    it("should create a new customer", async () => {
      const newCustomer = {
        ...mockCustomer,
        ...createDto,
        id: "new-customer-123",
      };

      jest.spyOn(prismaService.customers, "create").mockResolvedValue(newCustomer as any);

      const result = await service.create(createDto, mockOrganizationId);

      expect(result).toEqual(newCustomer);
      expect(prismaService.customers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createDto,
          organization_id: mockOrganizationId,
        }),
      });
    });

    it("should throw BadRequestException on database error", async () => {
      jest.spyOn(prismaService.customers, "create").mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        service.create(createDto, mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    const updateDto: UpdateCustomerDto = {
      name: "Updated Customer",
      phone: "+45 11111111",
    };

    it("should update customer successfully", async () => {
      const updatedCustomer = {
        ...mockCustomer,
        ...updateDto,
      };

      jest.spyOn(service, "findById").mockResolvedValue(mockCustomer as any);
      jest.spyOn(prismaService.customers, "update").mockResolvedValue(updatedCustomer as any);

      const result = await service.update(
        mockCustomerId,
        updateDto,
        mockOrganizationId
      );

      expect(result).toEqual(updatedCustomer);
      expect(service.findById).toHaveBeenCalledWith(
        mockCustomerId,
        mockOrganizationId
      );
      expect(prismaService.customers.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException if customer not found", async () => {
      jest.spyOn(service, "findById").mockRejectedValue(
        new NotFoundException("Customer not found")
      );

      await expect(
        service.update(mockCustomerId, updateDto, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on update error", async () => {
      jest.spyOn(service, "findById").mockResolvedValue(mockCustomer as any);
      jest.spyOn(prismaService.customers, "update").mockRejectedValue(
        new Error("Update error")
      );

      await expect(
        service.update(mockCustomerId, updateDto, mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("delete", () => {
    it("should delete customer successfully", async () => {
      jest.spyOn(service, "findById").mockResolvedValue(mockCustomer as any);
      jest.spyOn(prismaService.customers, "delete").mockResolvedValue(mockCustomer as any);

      await service.delete(mockCustomerId, mockOrganizationId);

      expect(service.findById).toHaveBeenCalledWith(
        mockCustomerId,
        mockOrganizationId
      );
      expect(prismaService.customers.delete).toHaveBeenCalledWith({
        where: {
          id: mockCustomerId,
          organization_id: mockOrganizationId,
        },
      });
    });

    it("should throw NotFoundException if customer not found", async () => {
      jest.spyOn(service, "findById").mockRejectedValue(
        new NotFoundException("Customer not found")
      );

      await expect(
        service.delete(mockCustomerId, mockOrganizationId)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on delete error", async () => {
      jest.spyOn(service, "findById").mockResolvedValue(mockCustomer as any);
      jest.spyOn(prismaService.customers, "delete").mockRejectedValue(
        new Error("Delete error")
      );

      await expect(
        service.delete(mockCustomerId, mockOrganizationId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("count", () => {
    it("should return customer count", async () => {
      const mockCount = 42;
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(mockCount);

      const result = await service.count(mockOrganizationId);

      expect(result).toBe(mockCount);
      expect(prismaService.customers.count).toHaveBeenCalledWith({
        where: {
          organization_id: mockOrganizationId,
        },
      });
    });

    it("should apply filters to count", async () => {
      const filters = { is_active: true };
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(10);

      await service.count(mockOrganizationId, filters);

      expect(prismaService.customers.count).toHaveBeenCalledWith({
        where: {
          organization_id: mockOrganizationId,
          ...filters,
        },
      });
    });
  });

  describe("findAllWithFilters", () => {
    const filters: CustomerFiltersDto = {
      page: 1,
      limit: 10,
      city: "Copenhagen",
      is_active: true,
      min_satisfaction: 4.0,
    };

    it("should return filtered customers", async () => {
      const mockCustomers = [mockCustomer];
      const mockCount = 1;

      jest.spyOn(prismaService.customers, "findMany").mockResolvedValue(mockCustomers as any);
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(mockCount);

      const result = await service.findAllWithFilters(mockOrganizationId, filters);

      expect(result.data).toEqual(mockCustomers);
      expect(result.total).toBe(mockCount);
      expect(prismaService.customers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organization_id: mockOrganizationId,
            is_active: true,
          }),
        })
      );
    });

    it("should apply city filter", async () => {
      jest.spyOn(prismaService.customers, "findMany").mockResolvedValue([]);
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(0);

      await service.findAllWithFilters(mockOrganizationId, filters);

      const callArg = (prismaService.customers.findMany as jest.Mock).mock.calls[0][0];
      expect(callArg.where).toHaveProperty("address");
    });

    it("should apply satisfaction score filter", async () => {
      jest.spyOn(prismaService.customers, "findMany").mockResolvedValue([]);
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(0);

      await service.findAllWithFilters(mockOrganizationId, filters);

      const callArg = (prismaService.customers.findMany as jest.Mock).mock.calls[0][0];
      expect(callArg.where).toHaveProperty("satisfaction_score");
      expect(callArg.where.satisfaction_score).toEqual({ gte: 4.0 });
    });

    it("should apply pagination", async () => {
      jest.spyOn(prismaService.customers, "findMany").mockResolvedValue([]);
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(0);

      const paginatedFilters = { ...filters, page: 2, limit: 20 };
      await service.findAllWithFilters(mockOrganizationId, paginatedFilters);

      expect(prismaService.customers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty results gracefully", async () => {
      jest.spyOn(prismaService.customers, "findMany").mockResolvedValue([]);
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(0);

      const result = await service.findAll(mockOrganizationId, { page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should handle large page numbers", async () => {
      jest.spyOn(prismaService.customers, "findMany").mockResolvedValue([]);
      jest.spyOn(prismaService.customers, "count").mockResolvedValue(0);

      const result = await service.findAll(mockOrganizationId, { page: 100, limit: 10 });

      expect(prismaService.customers.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 990,
        })
      );
    });

    it("should handle partial customer data", async () => {
      const partialCustomer = {
        id: mockCustomerId,
        organization_id: mockOrganizationId,
        name: "Partial Customer",
        email: "partial@example.com",
      };

      jest.spyOn(prismaService.customers, "create").mockResolvedValue(partialCustomer as any);

      const result = await service.create(
        {
          name: "Partial Customer",
          email: "partial@example.com",
        } as any,
        mockOrganizationId
      );

      expect(result).toEqual(partialCustomer);
    });
  });
});
