import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../database/prisma.service';
import { LeadStatus, LeadPriority } from './entities/lead.entity';
import {
  createMockPrismaService,
  mockLead,
  MockPrismaService,
} from '../../test/test-utils';

describe('LeadsService', () => {
  let service: LeadsService;
  let prismaService: MockPrismaService;

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new lead with defaults', async () => {
      const createDto = {
        name: 'New Lead',
        email: 'new@example.com',
        phone: '+45 12345678',
        address: 'Test Street 1',
        squareMeters: 100,
        rooms: 4,
        taskType: 'deep-cleaning',
        preferredDates: ['2025-11-01'],
      };

      const expectedLead = {
        id: 'new-lead-123',
        ...createDto,
        sessionId: null,
        customerId: null,
        source: null,
        emailThreadId: null,
        idempotencyKey: null,
        companyName: null,
        industry: null,
        estimatedSize: null,
        estimatedValue: null,
        enrichmentData: null,
        lastEnriched: null,
        lastScored: null,
        scoreMetadata: null,
        status: LeadStatus.NEW,
        score: 0,
        priority: LeadPriority.MEDIUM,
        followUpAttempts: 0,
        lastFollowUpDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.renosLead.create.mockResolvedValue(expectedLead);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedLead);
      expect(prismaService.renosLead.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          status: LeadStatus.NEW,
          score: 0,
          priority: LeadPriority.MEDIUM,
          followUpAttempts: 0,
          preferredDates: createDto.preferredDates,
        },
      });
    });

    it('should create a lead with empty preferredDates if not provided', async () => {
      const createDto = {
        name: 'New Lead',
        email: 'new@example.com',
      };

      const expectedLead = {
        ...mockLead,
        ...createDto,
      };

      prismaService.renosLead.create.mockResolvedValue(expectedLead);

      await service.create(createDto);

      expect(prismaService.renosLead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          preferredDates: [],
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated leads', async () => {
      const mockLeads = [mockLead];
      prismaService.renosLead.count.mockResolvedValue(1);
      prismaService.renosLead.findMany.mockResolvedValue(mockLeads);

      const result = await service.findAll({});

      expect(result.data).toEqual(mockLeads);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
      expect(prismaService.renosLead.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter leads by status', async () => {
      prismaService.renosLead.count.mockResolvedValue(1);
      prismaService.renosLead.findMany.mockResolvedValue([mockLead]);

      await service.findAll({ status: LeadStatus.NEW });

      expect(prismaService.renosLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: LeadStatus.NEW,
          }),
        }),
      );
    });

    it('should filter leads by priority', async () => {
      prismaService.renosLead.count.mockResolvedValue(1);
      prismaService.renosLead.findMany.mockResolvedValue([mockLead]);

      await service.findAll({ priority: LeadPriority.HIGH });

      expect(prismaService.renosLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: LeadPriority.HIGH,
          }),
        }),
      );
    });

    it('should filter leads by source', async () => {
      prismaService.renosLead.count.mockResolvedValue(1);
      prismaService.renosLead.findMany.mockResolvedValue([mockLead]);

      await service.findAll({ source: 'website' });

      expect(prismaService.renosLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            source: 'website',
          }),
        }),
      );
    });

    it('should filter leads by minEstimatedValue', async () => {
      prismaService.renosLead.count.mockResolvedValue(1);
      prismaService.renosLead.findMany.mockResolvedValue([mockLead]);

      await service.findAll({ minEstimatedValue: 3000 });

      expect(prismaService.renosLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estimatedValue: { gte: 3000 },
          }),
        }),
      );
    });

    it('should filter leads by minScore', async () => {
      prismaService.renosLead.count.mockResolvedValue(1);
      prismaService.renosLead.findMany.mockResolvedValue([mockLead]);

      await service.findAll({ minScore: 50 });

      expect(prismaService.renosLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            score: { gte: 50 },
          }),
        }),
      );
    });

    it('should search leads by name, email, or phone', async () => {
      prismaService.renosLead.count.mockResolvedValue(1);
      prismaService.renosLead.findMany.mockResolvedValue([mockLead]);

      await service.findAll({ search: 'test' });

      expect(prismaService.renosLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: expect.objectContaining({ contains: 'test' }) },
              { email: expect.objectContaining({ contains: 'test' }) },
              { phone: expect.objectContaining({ contains: 'test' }) },
            ]),
          }),
        }),
      );
    });

    it('should support custom sorting', async () => {
      prismaService.renosLead.count.mockResolvedValue(1);
      prismaService.renosLead.findMany.mockResolvedValue([mockLead]);

      await service.findAll({ sortBy: 'score', sortOrder: 'asc' });

      expect(prismaService.renosLead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { score: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a lead by id', async () => {
      prismaService.renosLead.findUnique.mockResolvedValue(mockLead);

      const result = await service.findOne(mockLead.id);

      expect(result).toEqual(mockLead);
      expect(prismaService.renosLead.findUnique).toHaveBeenCalledWith({
        where: { id: mockLead.id },
      });
    });

    it('should throw NotFoundException when lead not found', async () => {
      prismaService.renosLead.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a lead', async () => {
      const updateDto = {
        name: 'Updated Name',
        status: LeadStatus.CONTACTED,
      };
      const updatedLead = { ...mockLead, ...updateDto };

      prismaService.renosLead.findUnique.mockResolvedValue(mockLead);
      prismaService.renosLead.update.mockResolvedValue(updatedLead);

      const result = await service.update(mockLead.id, updateDto);

      expect(result).toEqual(updatedLead);
      expect(prismaService.renosLead.update).toHaveBeenCalledWith({
        where: { id: mockLead.id },
        data: updateDto,
      });
    });

    it('should throw NotFoundException when updating nonexistent lead', async () => {
      prismaService.renosLead.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a lead', async () => {
      prismaService.renosLead.findUnique.mockResolvedValue(mockLead);
      prismaService.renosLead.delete.mockResolvedValue(mockLead);

      await service.remove(mockLead.id);

      expect(prismaService.renosLead.delete).toHaveBeenCalledWith({
        where: { id: mockLead.id },
      });
    });

    it('should throw NotFoundException when deleting nonexistent lead', async () => {
      prismaService.renosLead.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('enrichLead', () => {
    it('should enrich a lead with company data', async () => {
      const enrichmentData = {
        companyName: 'Acme Corp',
        industry: 'Technology',
        estimatedSize: '51-200 employees',
        estimatedValue: 10000,
        enrichmentData: { website: 'https://acme.com' },
      };

      const enrichedLead = {
        ...mockLead,
        ...enrichmentData,
        lastEnriched: expect.any(Date),
      };

      prismaService.renosLead.update.mockResolvedValue(enrichedLead);

      const result = await service.enrichLead(mockLead.id, enrichmentData);

      expect(result).toEqual(enrichedLead);
      expect(prismaService.renosLead.update).toHaveBeenCalledWith({
        where: { id: mockLead.id },
        data: {
          ...enrichmentData,
          lastEnriched: expect.any(Date),
        },
      });
    });
  });

  describe('scoreLead', () => {
    it('should score a lead with priority', async () => {
      const score = 90;
      const priority = LeadPriority.URGENT;
      const metadata = { confidence: 0.95, factors: ['company_size', 'budget'] };

      const scoredLead = {
        ...mockLead,
        score,
        priority,
        lastScored: expect.any(Date),
        scoreMetadata: metadata,
      };

      prismaService.renosLead.update.mockResolvedValue(scoredLead);

      const result = await service.scoreLead(mockLead.id, score, priority, metadata);

      expect(result).toEqual(scoredLead);
      expect(prismaService.renosLead.update).toHaveBeenCalledWith({
        where: { id: mockLead.id },
        data: {
          score,
          priority,
          lastScored: expect.any(Date),
          scoreMetadata: metadata,
        },
      });
    });
  });

  describe('incrementFollowUpAttempts', () => {
    it('should increment follow-up attempts and set last follow-up date', async () => {
      const updatedLead = {
        ...mockLead,
        followUpAttempts: mockLead.followUpAttempts + 1,
        lastFollowUpDate: expect.any(Date),
      };

      prismaService.renosLead.update.mockResolvedValue(updatedLead);

      const result = await service.incrementFollowUpAttempts(mockLead.id);

      expect(result).toEqual(updatedLead);
      expect(prismaService.renosLead.update).toHaveBeenCalledWith({
        where: { id: mockLead.id },
        data: {
          followUpAttempts: { increment: 1 },
          lastFollowUpDate: expect.any(Date),
        },
      });
    });
  });
});
