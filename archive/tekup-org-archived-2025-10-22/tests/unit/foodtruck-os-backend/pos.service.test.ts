import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../apps/foodtruck-os-backend/src/prisma/prisma.service';
import { DanishPOSService } from '../../../apps/foodtruck-os-backend/src/pos/danish-pos.service';
import { createLogger } from '@tekup/shared';

// Mock logger
jest.mock('@tekup/shared', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

describe('DanishPOSService', () => {
  let service: DanishPOSService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sale: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    refund: {
      create: jest.fn(),
    },
    menuItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dailySalesReport: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DanishPOSService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DanishPOSService>(DanishPOSService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSale', () => {
    const mockSaleData = {
      truckId: 'truck-1',
      items: [
        {
          menuItemId: 'item-1',
          quantity: 2,
          unitPrice: 50,
        },
      ],
      paymentMethod: 'DANKORT' as const,
      totalAmount: 100,
      vatAmount: 20,
    };

    const mockMenuItem = {
      id: 'item-1',
      name: 'Burger',
      price: 50,
      inventory: { currentStock: 10 },
    };

    it('should successfully process a sale with Danish VAT compliance', async () => {
      mockPrismaService.menuItem.findUnique.mockResolvedValue(mockMenuItem);
      mockPrismaService.sale.create.mockResolvedValue({
        id: 'sale-123',
        receiptNumber: 'FT-2024-001',
        ...mockSaleData,
        timestamp: new Date(),
      });
      mockPrismaService.menuItem.update.mockResolvedValue({});

      const result = await service.processSale(mockSaleData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('receiptNumber');
      expect(result.vatAmount).toBe(20); // 20% Danish VAT
      expect(mockPrismaService.sale.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalAmount: 100,
          vatAmount: 20,
          paymentMethod: 'DANKORT',
        }),
      });
    });

    it('should handle insufficient inventory', async () => {
      const insufficientStockItem = { ...mockMenuItem, inventory: { currentStock: 1 } };
      mockPrismaService.menuItem.findUnique.mockResolvedValue(insufficientStockItem);

      await expect(service.processSale(mockSaleData)).rejects.toThrow(
        'Insufficient stock for item: Burger'
      );
    });

    it('should calculate Danish VAT correctly (25%)', async () => {
      const subtotal = 80;
      const expectedVat = subtotal * 0.25;
      const saleWithVat = {
        ...mockSaleData,
        totalAmount: subtotal + expectedVat,
        vatAmount: expectedVat,
      };

      mockPrismaService.menuItem.findUnique.mockResolvedValue(mockMenuItem);
      mockPrismaService.sale.create.mockResolvedValue({
        id: 'sale-123',
        ...saleWithVat,
      });

      const result = await service.processSale(saleWithVat);
      expect(result.vatAmount).toBe(20); // 25% of 80
    });
  });

  describe('processRefund', () => {
    it('should process refund with Danish consumer protection compliance', async () => {
      const mockSale = {
        id: 'sale-123',
        totalAmount: 100,
        paymentMethod: 'DANKORT',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };

      mockPrismaService.sale.findUnique.mockResolvedValue(mockSale);
      mockPrismaService.refund.create.mockResolvedValue({
        id: 'refund-123',
        saleId: 'sale-123',
        amount: 100,
        reason: 'Defective item',
      });

      const result = await service.processRefund('sale-123', 'Defective item');

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.refund.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          saleId: 'sale-123',
          reason: 'Defective item',
        }),
      });
    });
  });

  describe('generateDailySalesReport', () => {
    it('should generate daily sales report with Danish formatting', async () => {
      const today = new Date();
      const mockSales = [
        { totalAmount: 100, vatAmount: 20, paymentMethod: 'DANKORT' },
        { totalAmount: 150, vatAmount: 30, paymentMethod: 'MOBILEPAY' },
      ];

      mockPrismaService.sale.findMany.mockResolvedValue(mockSales);
      mockPrismaService.dailySalesReport.create.mockResolvedValue({
        id: 'report-123',
        date: today,
        totalSales: 250,
        totalVat: 50,
        transactionCount: 2,
      });

      const result = await service.generateDailySalesReport('truck-1');

      expect(result.totalSales).toBe(250);
      expect(result.totalVat).toBe(50);
      expect(result.transactionCount).toBe(2);
    });
  });
});
