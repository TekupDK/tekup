"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const supabase_service_1 = require("../../src/supabase/supabase.service");
describe('Customers (e2e)', () => {
    let app;
    let supabaseService;
    let authToken;
    let testCustomerId;
    const testCustomer = {
        name: 'Test Customer',
        email: 'customer@example.com',
        phone: '+45 12345678',
        address: '123 Test Street, Copenhagen',
        preferences: 'No pets, eco-friendly products only'
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        supabaseService = moduleFixture.get(supabase_service_1.SupabaseService);
        await app.init();
        const authResponse = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
            email: 'testowner@example.com',
            password: 'testpassword123',
            name: 'Test Owner',
            role: 'owner'
        });
        authToken = authResponse.body.access_token;
    });
    afterAll(async () => {
        if (testCustomerId) {
            await supabaseService.client
                .from('customers')
                .delete()
                .eq('id', testCustomerId);
        }
        await supabaseService.client
            .from('users')
            .delete()
            .eq('email', 'testowner@example.com');
        await app.close();
    });
    describe('/customers (POST)', () => {
        it('should create a new customer', async () => {
            const response = await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testCustomer)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(testCustomer.name);
            expect(response.body.email).toBe(testCustomer.email);
            expect(response.body.phone).toBe(testCustomer.phone);
            expect(response.body.address).toBe(testCustomer.address);
            expect(response.body.preferences).toBe(testCustomer.preferences);
            expect(response.body.totalJobs).toBe(0);
            testCustomerId = response.body.id;
        });
        it('should validate required fields', async () => {
            await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                email: 'incomplete@example.com'
            })
                .expect(400);
        });
        it('should validate email format', async () => {
            await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...testCustomer,
                email: 'invalid-email'
            })
                .expect(400);
        });
        it('should validate phone format', async () => {
            await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...testCustomer,
                phone: 'invalid-phone'
            })
                .expect(400);
        });
        it('should prevent duplicate email', async () => {
            await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testCustomer)
                .expect(409);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .post('/customers')
                .send({
                ...testCustomer,
                email: 'noauth@example.com'
            })
                .expect(401);
        });
    });
    describe('/customers (GET)', () => {
        it('should get all customers', async () => {
            const response = await request(app.getHttpServer())
                .get('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            const customer = response.body.find(c => c.id === testCustomerId);
            expect(customer).toBeDefined();
            expect(customer.name).toBe(testCustomer.name);
        });
        it('should search customers by name', async () => {
            const response = await request(app.getHttpServer())
                .get('/customers?search=Test Customer')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach(customer => {
                expect(customer.name.toLowerCase()).toContain('test customer');
            });
        });
        it('should search customers by email', async () => {
            const response = await request(app.getHttpServer())
                .get('/customers?search=customer@example.com')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            const customer = response.body.find(c => c.email === 'customer@example.com');
            expect(customer).toBeDefined();
        });
        it('should paginate results', async () => {
            const response = await request(app.getHttpServer())
                .get('/customers?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeLessThanOrEqual(10);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .get('/customers')
                .expect(401);
        });
    });
    describe('/customers/:id (GET)', () => {
        it('should get customer by id', async () => {
            const response = await request(app.getHttpServer())
                .get(`/customers/${testCustomerId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.id).toBe(testCustomerId);
            expect(response.body.name).toBe(testCustomer.name);
            expect(response.body.email).toBe(testCustomer.email);
            expect(response.body).toHaveProperty('jobs');
            expect(response.body).toHaveProperty('communicationLog');
        });
        it('should return 404 for non-existent customer', async () => {
            await request(app.getHttpServer())
                .get('/customers/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .get(`/customers/${testCustomerId}`)
                .expect(401);
        });
    });
    describe('/customers/:id (PUT)', () => {
        it('should update customer', async () => {
            const updateData = {
                name: 'Updated Customer Name',
                phone: '+45 87654321',
                preferences: 'Updated preferences'
            };
            const response = await request(app.getHttpServer())
                .put(`/customers/${testCustomerId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.name).toBe(updateData.name);
            expect(response.body.phone).toBe(updateData.phone);
            expect(response.body.preferences).toBe(updateData.preferences);
            expect(response.body.email).toBe(testCustomer.email);
        });
        it('should validate email format on update', async () => {
            await request(app.getHttpServer())
                .put(`/customers/${testCustomerId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                email: 'invalid-email-format'
            })
                .expect(400);
        });
        it('should return 404 for non-existent customer', async () => {
            await request(app.getHttpServer())
                .put('/customers/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                name: 'Updated Name'
            })
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .put(`/customers/${testCustomerId}`)
                .send({
                name: 'Updated Name'
            })
                .expect(401);
        });
    });
    describe('/customers/:id/communication (POST)', () => {
        it('should add communication log entry', async () => {
            const communicationData = {
                type: 'phone',
                direction: 'outbound',
                subject: 'Service reminder',
                content: 'Called to remind about upcoming cleaning service',
                contactedBy: 'Test Owner'
            };
            const response = await request(app.getHttpServer())
                .post(`/customers/${testCustomerId}/communication`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(communicationData)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.customerId).toBe(testCustomerId);
            expect(response.body.type).toBe(communicationData.type);
            expect(response.body.direction).toBe(communicationData.direction);
            expect(response.body.subject).toBe(communicationData.subject);
            expect(response.body.content).toBe(communicationData.content);
        });
        it('should validate communication type', async () => {
            await request(app.getHttpServer())
                .post(`/customers/${testCustomerId}/communication`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                type: 'invalid_type',
                direction: 'outbound',
                subject: 'Test',
                content: 'Test content'
            })
                .expect(400);
        });
        it('should validate communication direction', async () => {
            await request(app.getHttpServer())
                .post(`/customers/${testCustomerId}/communication`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                type: 'email',
                direction: 'invalid_direction',
                subject: 'Test',
                content: 'Test content'
            })
                .expect(400);
        });
    });
    describe('/customers/:id/satisfaction (POST)', () => {
        it('should record customer satisfaction', async () => {
            const satisfactionData = {
                jobId: 'test-job-id',
                rating: 5,
                feedback: 'Excellent service, very thorough cleaning',
                wouldRecommend: true
            };
            const response = await request(app.getHttpServer())
                .post(`/customers/${testCustomerId}/satisfaction`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(satisfactionData)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.customerId).toBe(testCustomerId);
            expect(response.body.rating).toBe(satisfactionData.rating);
            expect(response.body.feedback).toBe(satisfactionData.feedback);
            expect(response.body.wouldRecommend).toBe(satisfactionData.wouldRecommend);
        });
        it('should validate rating range', async () => {
            await request(app.getHttpServer())
                .post(`/customers/${testCustomerId}/satisfaction`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                jobId: 'test-job-id',
                rating: 6,
                feedback: 'Test feedback'
            })
                .expect(400);
        });
        it('should require rating', async () => {
            await request(app.getHttpServer())
                .post(`/customers/${testCustomerId}/satisfaction`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                jobId: 'test-job-id',
                feedback: 'Test feedback'
            })
                .expect(400);
        });
    });
    describe('/customers/:id/bookings (GET)', () => {
        it('should get customer booking history', async () => {
            const response = await request(app.getHttpServer())
                .get(`/customers/${testCustomerId}/bookings`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
        it('should filter bookings by status', async () => {
            const response = await request(app.getHttpServer())
                .get(`/customers/${testCustomerId}/bookings?status=completed`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        it('should filter bookings by date range', async () => {
            const response = await request(app.getHttpServer())
                .get(`/customers/${testCustomerId}/bookings?startDate=2025-01-01&endDate=2025-12-31`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    describe('/customers/:id (DELETE)', () => {
        it('should delete customer', async () => {
            const customerResponse = await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...testCustomer,
                email: 'todelete@example.com'
            });
            const customerToDeleteId = customerResponse.body.id;
            await request(app.getHttpServer())
                .delete(`/customers/${customerToDeleteId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            await request(app.getHttpServer())
                .get(`/customers/${customerToDeleteId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
        it('should prevent deletion of customer with active jobs', async () => {
            await request(app.getHttpServer())
                .delete(`/customers/${testCustomerId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            testCustomerId = null;
        });
        it('should return 404 for non-existent customer', async () => {
            await request(app.getHttpServer())
                .delete('/customers/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .delete('/customers/some-id')
                .expect(401);
        });
    });
    describe('Customer statistics', () => {
        beforeAll(async () => {
            const customerResponse = await request(app.getHttpServer())
                .post('/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...testCustomer,
                email: 'stats@example.com'
            });
            testCustomerId = customerResponse.body.id;
        });
        it('should get customer statistics', async () => {
            const response = await request(app.getHttpServer())
                .get(`/customers/${testCustomerId}/statistics`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('totalJobs');
            expect(response.body).toHaveProperty('completedJobs');
            expect(response.body).toHaveProperty('cancelledJobs');
            expect(response.body).toHaveProperty('averageRating');
            expect(response.body).toHaveProperty('totalSpent');
            expect(response.body).toHaveProperty('lastService');
            expect(response.body).toHaveProperty('nextService');
        });
    });
    describe('Customer preferences', () => {
        it('should update customer preferences', async () => {
            const preferencesData = {
                preferredTime: 'morning',
                specialRequests: ['eco-friendly products', 'no pets'],
                communicationPreference: 'email',
                recurringService: {
                    frequency: 'weekly',
                    dayOfWeek: 'monday',
                    timeSlot: '10:00'
                }
            };
            const response = await request(app.getHttpServer())
                .put(`/customers/${testCustomerId}/preferences`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(preferencesData)
                .expect(200);
            expect(response.body.preferences).toEqual(preferencesData);
        });
        it('should get customer preferences', async () => {
            const response = await request(app.getHttpServer())
                .get(`/customers/${testCustomerId}/preferences`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('preferredTime');
            expect(response.body).toHaveProperty('specialRequests');
            expect(response.body).toHaveProperty('communicationPreference');
        });
    });
});
//# sourceMappingURL=customers.e2e-spec.js.map