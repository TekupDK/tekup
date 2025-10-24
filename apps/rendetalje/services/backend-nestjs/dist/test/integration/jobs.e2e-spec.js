"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../../src/app.module");
const supabase_service_1 = require("../../src/supabase/supabase.service");
describe('Jobs (e2e)', () => {
    let app;
    let supabaseService;
    let authToken;
    let testCustomerId;
    let testJobId;
    const testCustomer = {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+45 12345678',
        address: '123 Test Street, Copenhagen',
        preferences: 'No pets'
    };
    const testJob = {
        serviceType: 'Standard Cleaning',
        scheduledDate: '2025-10-25',
        scheduledTime: '10:00',
        duration: 120,
        notes: 'Test job notes',
        specialInstructions: 'Please use eco-friendly products'
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
            email: 'testuser@example.com',
            password: 'testpassword123',
            name: 'Test User',
            role: 'owner'
        });
        authToken = authResponse.body.access_token;
        const customerResponse = await request(app.getHttpServer())
            .post('/customers')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testCustomer);
        testCustomerId = customerResponse.body.id;
    });
    afterAll(async () => {
        if (testJobId) {
            await supabaseService.client
                .from('jobs')
                .delete()
                .eq('id', testJobId);
        }
        if (testCustomerId) {
            await supabaseService.client
                .from('customers')
                .delete()
                .eq('id', testCustomerId);
        }
        await supabaseService.client
            .from('users')
            .delete()
            .eq('email', 'testuser@example.com');
        await app.close();
    });
    describe('/jobs (POST)', () => {
        it('should create a new job', async () => {
            const response = await request(app.getHttpServer())
                .post('/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...testJob,
                customerId: testCustomerId
            })
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.customerId).toBe(testCustomerId);
            expect(response.body.serviceType).toBe(testJob.serviceType);
            expect(response.body.status).toBe('pending');
            testJobId = response.body.id;
        });
        it('should validate required fields', async () => {
            await request(app.getHttpServer())
                .post('/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                customerId: testCustomerId
            })
                .expect(400);
        });
        it('should validate customer exists', async () => {
            await request(app.getHttpServer())
                .post('/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...testJob,
                customerId: 'non-existent-customer'
            })
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .post('/jobs')
                .send({
                ...testJob,
                customerId: testCustomerId
            })
                .expect(401);
        });
    });
    describe('/jobs (GET)', () => {
        it('should get all jobs', async () => {
            const response = await request(app.getHttpServer())
                .get('/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            const job = response.body.find(j => j.id === testJobId);
            expect(job).toBeDefined();
            expect(job.customer).toBeDefined();
            expect(job.customer.name).toBe(testCustomer.name);
        });
        it('should filter jobs by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/jobs?status=pending')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach(job => {
                expect(job.status).toBe('pending');
            });
        });
        it('should filter jobs by date range', async () => {
            const response = await request(app.getHttpServer())
                .get('/jobs?startDate=2025-10-25&endDate=2025-10-25')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach(job => {
                expect(job.scheduledDate).toBe('2025-10-25');
            });
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .get('/jobs')
                .expect(401);
        });
    });
    describe('/jobs/:id (GET)', () => {
        it('should get job by id', async () => {
            const response = await request(app.getHttpServer())
                .get(`/jobs/${testJobId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.id).toBe(testJobId);
            expect(response.body.customer).toBeDefined();
            expect(response.body.customer.name).toBe(testCustomer.name);
            expect(response.body.checklist).toBeDefined();
            expect(response.body.timeEntries).toBeDefined();
        });
        it('should return 404 for non-existent job', async () => {
            await request(app.getHttpServer())
                .get('/jobs/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .get(`/jobs/${testJobId}`)
                .expect(401);
        });
    });
    describe('/jobs/:id (PUT)', () => {
        it('should update job', async () => {
            const updateData = {
                status: 'in_progress',
                notes: 'Updated notes',
                checklist: [
                    {
                        id: 'checklist-1',
                        task: 'Clean bathroom',
                        completed: true,
                        notes: 'Completed successfully'
                    }
                ]
            };
            const response = await request(app.getHttpServer())
                .put(`/jobs/${testJobId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.status).toBe('in_progress');
            expect(response.body.notes).toBe('Updated notes');
            expect(response.body.checklist).toHaveLength(1);
            expect(response.body.checklist[0].completed).toBe(true);
        });
        it('should validate status transitions', async () => {
            await request(app.getHttpServer())
                .put(`/jobs/${testJobId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                status: 'invalid_status'
            })
                .expect(400);
        });
        it('should return 404 for non-existent job', async () => {
            await request(app.getHttpServer())
                .put('/jobs/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                status: 'completed'
            })
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .put(`/jobs/${testJobId}`)
                .send({
                status: 'completed'
            })
                .expect(401);
        });
    });
    describe('/jobs/:id/assign (POST)', () => {
        it('should assign job to team member', async () => {
            const teamMemberResponse = await request(app.getHttpServer())
                .post('/team')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                name: 'Test Employee',
                email: 'employee@example.com',
                role: 'employee',
                skills: ['standard_cleaning']
            });
            const teamMemberId = teamMemberResponse.body.id;
            const response = await request(app.getHttpServer())
                .post(`/jobs/${testJobId}/assign`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                teamMemberId: teamMemberId
            })
                .expect(200);
            expect(response.body.assignedTo).toBe(teamMemberId);
            await supabaseService.client
                .from('team_members')
                .delete()
                .eq('id', teamMemberId);
        });
        it('should validate team member exists', async () => {
            await request(app.getHttpServer())
                .post(`/jobs/${testJobId}/assign`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                teamMemberId: 'non-existent-member'
            })
                .expect(404);
        });
    });
    describe('/jobs/:id/photos (POST)', () => {
        it('should upload job photo', async () => {
            const response = await request(app.getHttpServer())
                .post(`/jobs/${testJobId}/photos`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('photo', Buffer.from('fake image data'), 'test.jpg')
                .field('type', 'before')
                .field('checklistItemId', 'checklist-1')
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('url');
            expect(response.body.type).toBe('before');
            expect(response.body.jobId).toBe(testJobId);
        });
        it('should validate photo type', async () => {
            await request(app.getHttpServer())
                .post(`/jobs/${testJobId}/photos`)
                .set('Authorization', `Bearer ${authToken}`)
                .attach('photo', Buffer.from('fake image data'), 'test.jpg')
                .field('type', 'invalid_type')
                .expect(400);
        });
        it('should require photo file', async () => {
            await request(app.getHttpServer())
                .post(`/jobs/${testJobId}/photos`)
                .set('Authorization', `Bearer ${authToken}`)
                .field('type', 'before')
                .expect(400);
        });
    });
    describe('/jobs/:id/time-entries (POST)', () => {
        it('should create time entry', async () => {
            const timeEntryData = {
                startTime: '2025-10-25T10:00:00Z',
                endTime: '2025-10-25T12:00:00Z',
                breakDuration: 15,
                notes: 'Completed cleaning'
            };
            const response = await request(app.getHttpServer())
                .post(`/jobs/${testJobId}/time-entries`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(timeEntryData)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.jobId).toBe(testJobId);
            expect(response.body.startTime).toBe(timeEntryData.startTime);
            expect(response.body.endTime).toBe(timeEntryData.endTime);
            expect(response.body.breakDuration).toBe(timeEntryData.breakDuration);
        });
        it('should validate time entry data', async () => {
            await request(app.getHttpServer())
                .post(`/jobs/${testJobId}/time-entries`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                startTime: '2025-10-25T10:00:00Z'
            })
                .expect(400);
        });
        it('should validate end time is after start time', async () => {
            await request(app.getHttpServer())
                .post(`/jobs/${testJobId}/time-entries`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                startTime: '2025-10-25T12:00:00Z',
                endTime: '2025-10-25T10:00:00Z'
            })
                .expect(400);
        });
    });
    describe('/jobs/:id (DELETE)', () => {
        it('should delete job', async () => {
            const jobResponse = await request(app.getHttpServer())
                .post('/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...testJob,
                customerId: testCustomerId
            });
            const jobToDeleteId = jobResponse.body.id;
            await request(app.getHttpServer())
                .delete(`/jobs/${jobToDeleteId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            await request(app.getHttpServer())
                .get(`/jobs/${jobToDeleteId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
        it('should return 404 for non-existent job', async () => {
            await request(app.getHttpServer())
                .delete('/jobs/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
        it('should require authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/jobs/${testJobId}`)
                .expect(401);
        });
    });
    describe('Job status workflow', () => {
        it('should follow proper status transitions', async () => {
            const jobResponse = await request(app.getHttpServer())
                .post('/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                ...testJob,
                customerId: testCustomerId
            });
            const workflowJobId = jobResponse.body.id;
            await request(app.getHttpServer())
                .put(`/jobs/${workflowJobId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'scheduled' })
                .expect(200);
            await request(app.getHttpServer())
                .put(`/jobs/${workflowJobId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'in_progress' })
                .expect(200);
            await request(app.getHttpServer())
                .put(`/jobs/${workflowJobId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'completed' })
                .expect(200);
            await supabaseService.client
                .from('jobs')
                .delete()
                .eq('id', workflowJobId);
        });
    });
});
//# sourceMappingURL=jobs.e2e-spec.js.map