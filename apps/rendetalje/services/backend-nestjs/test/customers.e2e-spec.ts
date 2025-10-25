import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CustomersController } from '../src/customers/customers.controller';
import { CustomersService } from '../src/customers/customers.service';
import { PrismaService } from '../src/database/prisma.service';
import { LeadStatus, LeadPriority } from '../src/leads/entities/lead.entity';

describe('CustomersController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const testCustomers: any[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: {
            renosCustomer: {
              create: jest.fn((args) => {
                const customer = {
                  id: `test-id-${Date.now()}`,
                  ...args.data,
                  totalLeads: 0,
                  totalBookings: 0,
                  totalRevenue: 0,
                  lastContactAt: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                testCustomers.push(customer);
                return Promise.resolve(customer);
              }),
              findMany: jest.fn(() => Promise.resolve(testCustomers)),
              count: jest.fn(() => Promise.resolve(testCustomers.length)),
              findUnique: jest.fn((args) => {
                const customer = testCustomers.find(c => c.id === args.where.id);
                return Promise.resolve(customer || null);
              }),
              update: jest.fn((args) => {
                const index = testCustomers.findIndex(c => c.id === args.where.id);
                if (index >= 0) {
                  testCustomers[index] = { ...testCustomers[index], ...args.data };
                  return Promise.resolve(testCustomers[index]);
                }
                return Promise.resolve(null);
              }),
              delete: jest.fn((args) => {
                const index = testCustomers.findIndex(c => c.id === args.where.id);
                if (index >= 0) {
                  const deleted = testCustomers.splice(index, 1)[0];
                  return Promise.resolve(deleted);
                }
                return Promise.resolve(null);
              }),
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same validation pipe as main app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up
    testCustomers.length = 0;
    await app.close();
  });

  describe('POST /customers', () => {
    it('should create a new customer', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Integration Test Customer',
          email: 'integration-test@example.com',
          phone: '+45 12345678',
          address: 'Test Street 123, Copenhagen',
          companyName: 'Integration Test Company',
          status: 'active',
          tags: ['test', 'integration'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Integration Test Customer');
          expect(res.body.email).toBe('integration-test@example.com');
          expect(res.body.status).toBe('active');
          expect(res.body.tags).toEqual(['test', 'integration']);
          expect(res.body.totalLeads).toBe(0);
          expect(res.body.totalBookings).toBe(0);
          expect(res.body.totalRevenue).toBe(0);
        });
    });

    it('should create a customer with minimal data', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Minimal Customer',
          email: 'minimal-integration@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Minimal Customer');
          expect(res.body.email).toBe('minimal-integration@example.com');
          
          createdCustomerIds.push(res.body.id);
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Invalid Email Customer',
          email: 'not-an-email',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .send({
          phone: '+45 12345678',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });
  });

  describe('GET /customers', () => {
    it('should return paginated customers', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('totalPages');
          expect(res.body).toHaveProperty('hasNext');
          expect(res.body).toHaveProperty('hasPrev');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter customers by status', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .query({ status: 'active' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          if (res.body.data.length > 0) {
            res.body.data.forEach((customer: any) => {
              expect(customer.status).toBe('active');
            });
          }
        });
    });

    it('should search customers by text', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .query({ search: 'Integration Test' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          if (res.body.data.length > 0) {
            const found = res.body.data.some((c: any) => 
              c.name.includes('Integration Test') || 
              c.email.includes('integration-test')
            );
            expect(found).toBe(true);
          }
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .query({ page: 1, limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should filter by tag', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .query({ tag: 'test' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          if (res.body.data.length > 0) {
            res.body.data.forEach((customer: any) => {
              expect(customer.tags).toContain('test');
            });
          }
        });
    });
  });

  describe('GET /customers/:id', () => {
    it('should return a customer by ID', async () => {
      // First create a customer to test with
      const createRes = await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Test Get Customer',
          email: 'test-get-integration@example.com',
        });

      const customerId = createRes.body.id;
      createdCustomerIds.push(customerId);

      return request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(customerId);
          expect(res.body.name).toBe('Test Get Customer');
          expect(res.body.email).toBe('test-get-integration@example.com');
        });
    });

    it('should return 404 for non-existent customer', () => {
      return request(app.getHttpServer())
        .get('/customers/non-existent-id-12345')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });

  describe('PATCH /customers/:id', () => {
    it('should update a customer', async () => {
      // Create a customer to update
      const createRes = await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Original Name',
          email: 'original-integration@example.com',
        });

      const customerId = createRes.body.id;
      createdCustomerIds.push(customerId);

      return request(app.getHttpServer())
        .patch(`/customers/${customerId}`)
        .send({
          name: 'Updated Name',
          phone: '+45 99887766',
          companyName: 'Updated Company',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(customerId);
          expect(res.body.name).toBe('Updated Name');
          expect(res.body.phone).toBe('+45 99887766');
          expect(res.body.companyName).toBe('Updated Company');
          expect(res.body.email).toBe('original-integration@example.com');
        });
    });

    it('should return 404 when updating non-existent customer', () => {
      return request(app.getHttpServer())
        .patch('/customers/non-existent-id-12345')
        .send({
          name: 'Updated Name',
        })
        .expect(404);
    });

    it('should validate update data', async () => {
      if (createdCustomerIds.length > 0) {
        return request(app.getHttpServer())
          .patch(`/customers/${createdCustomerIds[0]}`)
          .send({
            email: 'invalid-email',
          })
          .expect(400);
      }
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should delete a customer', async () => {
      // Create a customer to delete
      const createRes = await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'To Be Deleted',
          email: 'delete-me-integration@example.com',
        });

      const customerId = createRes.body.id;

      // Delete it
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .expect(204);

      // Verify it's gone
      return request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent customer', () => {
      return request(app.getHttpServer())
        .delete('/customers/non-existent-id-12345')
        .expect(404);
    });
  });
});

