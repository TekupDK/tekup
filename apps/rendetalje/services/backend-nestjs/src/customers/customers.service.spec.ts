import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../database/prisma.service';
import {
  createMockPrismaService,
  mockCustomer,
  mockUser,
} from '../../test/test-utils';

describe('CustomersService', () => {
  let service: CustomersService;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createDto = {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '+45 12345678',
        address: 'Test Street 1',
        companyName: 'New Company',
        status: 'active',
        tags: ['new'],
      };

      const expectedCustomer = {
        id: 'new-customer-123',
        ...createDto,
        notes: null,
        totalLeads: 0,
        totalBookings: 0,
        totalRevenue: 0,
        lastContactAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.renosCustomer.create.mockResolvedValue(expectedCustomer);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedCustomer);
      expect(prismaService.renosCustomer.create).toHaveBeenCalledWith({
        data: { ...createDto, tags: createDto.tags || [], status: 'active' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [mockCustomer];
      prismaService.renosCustomer.findMany.mockResolvedValue(mockCustomers);
      prismaService.renosCustomer.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toEqual(mockCustomers);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
      expect(prismaService.renosCustomer.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter customers by search term', async () => {
      prismaService.renosCustomer.findMany.mockResolvedValue([mockCustomer]);
      prismaService.renosCustomer.count.mockResolvedValue(1);

      await service.findAll({ search: 'test' });

      expect(prismaService.renosCustomer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: expect.objectContaining({ contains: 'test' }) },
              { email: expect.objectContaining({ contains: 'test' }) },
            ]),
          }),
        }),
      );
    });

    it('should filter customers by status', async () => {
      prismaService.renosCustomer.findMany.mockResolvedValue([mockCustomer]);
      prismaService.renosCustomer.count.mockResolvedValue(1);

      await service.findAll({ status: 'active' });

      expect(prismaService.renosCustomer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      prismaService.renosCustomer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findOne(mockCustomer.id);

      expect(result).toEqual(mockCustomer);
      expect(prismaService.renosCustomer.findUnique).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      prismaService.renosCustomer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const updateDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const updatedCustomer = {
        ...mockCustomer,
        ...updateDto,
      };

      prismaService.renosCustomer.findUnique.mockResolvedValue(mockCustomer);
      prismaService.renosCustomer.update.mockResolvedValue(updatedCustomer);

      const result = await service.update(mockCustomer.id, updateDto);

      expect(result).toEqual(updatedCustomer);
      expect(prismaService.renosCustomer.update).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
        data: updateDto,
      });
    });

    it('should throw NotFoundException when updating nonexistent customer', async () => {
      prismaService.renosCustomer.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a customer', async () => {
      prismaService.renosCustomer.findUnique.mockResolvedValue(mockCustomer);
      prismaService.renosCustomer.delete.mockResolvedValue(mockCustomer);

      await service.remove(mockCustomer.id);

      expect(prismaService.renosCustomer.delete).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
      });
    });

    it('should throw NotFoundException when deleting nonexistent customer', async () => {
      prismaService.renosCustomer.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});