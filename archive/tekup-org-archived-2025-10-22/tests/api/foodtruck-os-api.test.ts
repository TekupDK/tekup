import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../apps/foodtruck-os-backend/src/app.module';
import { PrismaService } from '../../apps/foodtruck-os-backend/src/prisma/prisma.service';

describe('FoodTruck OS API Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        menuItem: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: '1',
              name: 'Test Burger',
              price: 85,
              category: 'Main',
              available: true,
            },
          ]),
          create: jest.fn(),
          update: jest.fn(),
        },
        sale: {
          create: jest.fn().mockResolvedValue({
            id: 'sale-123',
            receiptNumber: 'FT-2024-001',
            totalAmount: 85,
            vatAmount: 17,
          }),
        },
        dailySalesReport: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POS Endpoints', () => {
    it('/pos/sales (POST) - should process sale', async () => {
      const saleData = {
        truckId: 'truck-1',
        items: [
          {
            menuItemId: '1',
            quantity: 1,
            unitPrice: 85,
          },
        ],
        paymentMethod: 'DANKORT',
        totalAmount: 85,
        vatAmount: 17,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/pos/sales')
        .send(saleData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('receiptNumber');
      expect(response.body.vatAmount).toBe(17);
    });

    it('/pos/daily-sales (GET) - should return daily sales report', async () => {
      prisma.dailySalesReport.findFirst = jest.fn().mockResolvedValue({
        id: 'report-1',
        date: new Date(),
        totalSales: 850,
        totalVat: 170,
        transactionCount: 10,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/pos/daily-sales')
        .expect(200);

      expect(response.body).toHaveProperty('totalSales');
      expect(response.body).toHaveProperty('totalVat');
      expect(response.body).toHaveProperty('transactionCount');
    });
  });

  describe('Menu Endpoints', () => {
    it('/menu/truck-1/items (GET) - should return menu items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/menu/truck-1/items')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('category');
    });

    it('/menu/items (POST) - should create menu item', async () => {
      const menuItemData = {
        truckId: 'truck-1',
        name: 'New Burger',
        description: 'Delicious new burger',
        price: 95,
        category: 'Main',
        allergens: ['gluten'],
        ingredients: ['beef', 'bun'],
      };

      prisma.menuItem.create = jest.fn().mockResolvedValue({
        id: 'item-new',
        ...menuItemData,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/menu/items')
        .send(menuItemData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Burger');
    });
  });

  describe('Compliance Endpoints', () => {
    it('/compliance/temperature-logs (POST) - should log temperature', async () => {
      const tempData = {
        location: 'Freezer',
        temperature: -18,
        timestamp: new Date(),
      };

      prisma.temperatureLog = {
        create: jest.fn().mockResolvedValue({
          id: 'log-123',
          ...tempData,
          compliant: true,
        }),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/compliance/temperature-logs')
        .send(tempData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.compliant).toBe(true);
    });
  });
});
